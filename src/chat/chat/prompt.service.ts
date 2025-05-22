import { Transactional, TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import * as dateFnsTz from 'date-fns-tz';
import { formatInTimeZone } from 'date-fns-tz';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import * as R from 'remeda';
import { CognitoService } from 'src/aws/cognito.service';
import {
  PATCH_USER_PROFILE_TOOL_NAME,
  ProfileField,
} from 'src/chat/tool/profile.tool';
import {
  chatMessages,
  chats,
  DbTransactionAdapter,
  followUps,
  users,
} from 'src/db';
import { EDIT_WELLNESS_PLAN_TOOL_NAME } from '../tool/edit-wellness-plan.tool';
import { FOLLOWUP_TOOL_NAME } from '../tool/followup.tool';
import { COMPLETE_ONBOARDING_TOOL_NAME } from '../tool/onboarding.tool';
import { MappedUserResult, ResultService } from './result.service';

// Add ChatContextMetadata interface
export interface ChatContextMetadata {
  currentMessageCount: number;
  totalHistoryCount: number;
  userTimeZone: string;
  scheduledFollowups: {
    id: string;
    // Formatted to user's local time
    dueDate: string;
    content: string;
  }[];
  userProfile: ProfileField | null;
  isOnboarded: boolean;
  wellnessPlan?: string;
}

const toneAndFeel = `
	•	Supportive & Encouraging: Maintain a warm, uplifting, and affirming approach, consistently acknowledging the user's efforts and strengths.
	•	Empathetic & Personal: Communicate in a way that shows genuine care and understanding, demonstrating awareness of the user's unique patterns and challenges.
	•	Informative & Insightful: Provide clear explanations about the user's behaviors or test results, helping them understand how their choices affect their body and well-being.
	•	Actionable & Practical: Always suggest specific, manageable strategies and tips that the user can realistically integrate into their daily life.
	•	Balanced & Nuanced: Gently address the user's patterns without judgment or criticism, framing improvements positively as opportunities rather than shortcomings.
	•	Empowering & Motivational: Consistently highlight the benefits of self-care and recovery, reinforcing that these practices enhance overall performance and strength, not diminish drive.
	•	Gentle & Friendly: Keep communication casual, conversational, and approachable, incorporating appropriate warmth (e.g., emojis, gentle humor) to foster a sense of comfort and connection.
	•	Mindful & Holistic: Consider both physical and emotional dimensions of health, guiding the user toward mindful practices that support overall balance and well-being.`;

// Added constant
const MAX_HISTORY_MESSAGES_FOR_CONTEXT = 30;

@Injectable()
export class PromptService {
  constructor(
    private readonly resultService: ResultService,
    private readonly txHost: TransactionHost<DbTransactionAdapter>,
    private readonly cognitoService: CognitoService,
  ) {}

  // New private methods to fetch context data
  @Transactional()
  private async getUserTimeZone(userId: string): Promise<string> {
    const user = await this.txHost.tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { timeZone: true },
    });
    return user?.timeZone || 'UTC'; // Default to UTC if not set
  }

  @Transactional()
  private async getUserProfile(userId: string): Promise<ProfileField | null> {
    const user = await this.txHost.tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { profile: true },
    });
    return (user?.profile as ProfileField) || null;
  }

  @Transactional()
  async getIsUserOnboarded(userId: string): Promise<boolean> {
    const user = await this.txHost.tx.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { isOnboarded: true },
    });
    return user?.isOnboarded || false;
  }

  @Transactional()
  private async getTotalMessageCount(
    userId: string,
    chatId: string,
  ): Promise<number> {
    const result = await this.txHost.tx
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(chatMessages)
      .where(
        and(eq(chatMessages.userId, userId), eq(chatMessages.chatId, chatId)),
      );
    return result[0]?.count || 0;
  }

  @Transactional()
  private async getCurrentMessageCount(
    userId: string,
    chatId: string,
  ): Promise<number> {
    const messages = await this.txHost.tx.query.chatMessages.findMany({
      where: and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.chatId, chatId),
      ),
      orderBy: [desc(chatMessages.createdAt)],
      limit: MAX_HISTORY_MESSAGES_FOR_CONTEXT,
      columns: { id: true },
    });
    return messages.length;
  }

  @Transactional()
  private async getPendingFollowups(
    userId: string,
    userTimeZone: string,
  ): Promise<ChatContextMetadata['scheduledFollowups']> {
    const pendingFollowupsDb = await this.txHost.tx.query.followUps.findMany({
      where: and(eq(followUps.userId, userId), eq(followUps.status, 'pending')),
      orderBy: [asc(followUps.dueDate)],
      columns: {
        id: true,
        dueDate: true,
        content: true,
      },
    });

    return pendingFollowupsDb.map((followup) => ({
      id: followup.id,
      dueDate: formatInTimeZone(
        followup.dueDate,
        userTimeZone,
        'yyyy-MM-dd HH:mm',
      ),
      content: followup.content,
    }));
  }

  @Transactional()
  private async getWellnessPlanForChat(
    chatId: string,
  ): Promise<string | undefined> {
    const chat = await this.txHost.tx.query.chats.findFirst({
      where: eq(chats.id, chatId),
      columns: { wellnessPlan: true },
    });
    return chat?.wellnessPlan || undefined;
  }

  async getSystemPrompt(
    userId: string,
    evogenomApiToken: string,
    chatId: string,
  ) {
    // Fetch context data internally
    const userTimeZone = await this.getUserTimeZone(userId);

    const [
      totalHistoryCount,
      currentMessageCount,
      scheduledFollowups,
      userProfile,
      isOnboarded,
      mappedUserResults,
      wellnessPlan,
    ] = await Promise.all([
      this.getTotalMessageCount(userId, chatId),
      this.getCurrentMessageCount(userId, chatId),
      this.getPendingFollowups(userId, userTimeZone),
      this.getUserProfile(userId),
      this.getIsUserOnboarded(userId),
      this.resultService.getMappedUserResults(userId, evogenomApiToken),
      this.getWellnessPlanForChat(chatId),
    ]);

    const contextMetadata: ChatContextMetadata = {
      currentMessageCount,
      totalHistoryCount,
      userTimeZone,
      scheduledFollowups,
      userProfile,
      isOnboarded,
      wellnessPlan,
    };

    return this.formatSystemPrompt(mappedUserResults, contextMetadata);
  }

  private formatUserProfileInfo(userProfile: ProfileField | null): string {
    if (!userProfile) {
      return '';
    }

    const profileEntries = Object.entries(userProfile)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      )
      .map(
        ([key, value]) =>
          `  - ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`,
      );

    if (profileEntries.length === 0) {
      return '';
    }

    return `
# User Profile
${profileEntries.join('\n')}
`;
  }

  formatSystemPrompt(
    mappedUserResults: MappedUserResult[],
    contextMetadata: ChatContextMetadata,
  ) {
    // ONBOARDING PROMPT
    if (!contextMetadata.isOnboarded) {
      const onboardingSpecificInstructions = `
# IMPORTANT! Your current task is as follows:
1. Inform the user that their profile is incomplete and that you will guide them through setting it up.
2. Ask for the following profile fields one by one or in small groups. For each piece of information the user provides, use the '${PATCH_USER_PROFILE_TOOL_NAME}' tool to save it immediately:
    - Name
    - Age
    - Gender
    - Height (in cm)
    - Weight (in kg)
    - Work/Occupation
    - Physical Activity Level
3. Acknowledge if the user chooses not to provide certain information.
4. Once all fields have been prompted for, or the user indicates they do not wish to provide more information, use the '${COMPLETE_ONBOARDING_TOOL_NAME}' tool to mark their onboarding as complete.
`;

      const userProfileInfo = this.formatUserProfileInfo(
        contextMetadata.userProfile,
      );

      return `
# Current date and time: ${dateFnsTz.formatInTimeZone(new Date(), contextMetadata.userTimeZone, 'yyyy-MM-dd HH:mm')}
# Your Role & Purpose
You are an AI Wellness Coach. Your primary goal right now is to help the user set up their profile.
Your role is to:
- Guide the user through completing their profile information smoothly and efficiently.
- Maintain a supportive and encouraging tone throughout the onboarding process.
- Be consistent, compassionate, and constructive in all interactions
- Instead of giving long answers, give short and concise answers and ask follow up questions if needed, remember that you are typing to a mobile chat app, reading long text is not practical for the user.

- You may use ONLY the following markdown tags: bold, italic, underline, bullet points
# Take on the following tone and feel in your responses:
${toneAndFeel}

${onboardingSpecificInstructions}
${userProfileInfo}
`;
    }

    // COACH PROMPT (User is onboarded)
    let genotypingDetails: string;
    const hasGenotypingResults =
      mappedUserResults && mappedUserResults.length > 0;
    if (!hasGenotypingResults) {
      genotypingDetails = `- User's sample is being processed and results will arrive within 4-8 weeks after mailing the sample kit.`;
    } else {
      genotypingDetails = R.pipe(
        mappedUserResults,
        R.map((mappedResult) => {
          // Ensuring that key properties exist and are not empty strings before creating the line.
          if (
            mappedResult.finalProductName &&
            mappedResult.interpretationText
          ) {
            return `  - ${mappedResult.finalProductName}: ${mappedResult.interpretationText}`;
          }
          return null; // Return null if data is incomplete
        }),
        R.filter((line): line is string => line !== null), // Filter out the nulls
        R.join('\n'),
      );
      // If, after mapping and filtering, genotypingDetails is an empty string
      // (e.g., all mappedUserResults had null/empty finalProductName or interpretationText),
      // the "User's genotyping results" section will be effectively empty except for the header.
    }

    const followupsInfo =
      contextMetadata?.scheduledFollowups &&
      contextMetadata.scheduledFollowups.length > 0
        ? `
# Scheduled Follow-ups
${contextMetadata.scheduledFollowups
  .map(
    (followup) =>
      `- Follow-up ID: ${followup.id}, Due: ${followup.dueDate} Content: ${followup.content}`,
  )
  .join('\n')}
`
        : '';

    const chatContextInfo = contextMetadata
      ? `
<chat-context-information>
- Current conversation: ${contextMetadata.currentMessageCount} messages
- Total history: ${contextMetadata.totalHistoryCount} messages
${
  contextMetadata.totalHistoryCount > contextMetadata.currentMessageCount
    ? '- Note: There are previous conversations not included in this context. Use the memory tool to search this history if needed.'
    : ''
}
${followupsInfo}
</chat-context-information>
`
      : '';

    const userProfileInfo = this.formatUserProfileInfo(
      contextMetadata.userProfile,
    );

    const wellnessPlanInfo = contextMetadata.wellnessPlan
      ? `
<user-wellness-plan>
User's wellness plan is currently as follows:
\`\`\`markdown
${contextMetadata.wellnessPlan}
\`\`\`
</user-wellness-plan>
`
      : '';

    return `
<role-and-purpose>
# Your Role & Purpose
You are an AI Wellness Coach. Your role is to:
- Act as a smart, supportive companion for the user
- Guide users through everyday wellbeing choices including recovery, rest, energy management, and self-leadership
- Provide timely, personalized nudges based on the user's patterns, behavior, and needs
- Reflect the user's lifestyle and recognize their habits
- Communicate like a mentor who genuinely cares about the user's wellbeing
- Be consistent, compassionate, and constructive in all interactions
- Instead of giving long answers, give short and concise answers and ask follow up questions if needed, remember that you are typing to a mobile chat app, reading long text is not practical for the user.
${hasGenotypingResults ? `- Remember to include relevant user's genotyping results in your responses. If the results are not relevant to the user's question, you can tell the user so.` : ''}
- Only assist the user with questions related to their wellbeing and genotyping results, otherwise kindly instruct the user to stay on topic.
Remember that you are not just a chatbot - you are a coach who knows the user personally and is invested in their wellness journey.
You are employed at Evogenom, a DNA genotyping company. Evogenom sells DNA tests to customers and provides insights into their DNA, specifically how their DNA affects their health and wellbeing.
</role-and-purpose>

<formatting-instructions>
Format your responses in markdown
- You may use ONLY the following markdown tags: bold, italic, underline, bullet points
- Your messages are shown in a mobile app chat UI, so you can use emojis to add some fun and personality to your responses.
</formatting-instructions>

${chatContextInfo}
<user-genotyping-results>
# User's genotyping results
${genotypingDetails}
</user-genotyping-results>

<user-profile>
${userProfileInfo}
</user-profile>

<user-wellness-plan>
${wellnessPlanInfo}
</user-wellness-plan>

<tone-and-feel>
# Take on the following tone and feel in your responses:
${toneAndFeel}
</tone-and-feel>

<tools>
${EDIT_WELLNESS_PLAN_TOOL_NAME} : Use this tool to edit the user's wellness plan. Do not add any extra headings, this wellness plan is displayed in the UI and it's obvious to the user that it's a wellness plan. When use acknowledges your wellness suggestions, use this tool to add your suggestions to the wellness plan.
${PATCH_USER_PROFILE_TOOL_NAME} : Use this tool to update the user's profile. You may use this tool to update the user's profile at any time.
${FOLLOWUP_TOOL_NAME} : Use this tool to create follow ups for the user.
</tools>
`;
  }

  async getInitialWelcomeSystemPrompt(userId: string): Promise<string> {
    const userTimeZone = await this.getUserTimeZone(userId);
    const userLanguage = await this.cognitoService.getUserLanguage(userId);

    return `
# Current date and time: ${dateFnsTz.formatInTimeZone(new Date(), userTimeZone, 'yyyy-MM-dd HH:mm')}
# Your Role & Purpose
You are an AI Wellness Coach from Evogenom.
Your primary goal is to warmly welcome the user and briefly introduce your capabilities.

# Instructions
- Introduce yourself as their personal AI Wellness Coach.
- Briefly explain that you can help with topics like: everyday wellbeing choices, recovery, rest, energy management, and self-leadership.
- Mention that you can provide personalized nudges and insights.
- Maintain a supportive, friendly, and encouraging tone.
- You may use ONLY the following markdown tags: bold, italic, underline, bullet points

# Take on the following tone and feel in your responses:
${toneAndFeel}

# Language: You MUST respond in ${userLanguage}.

You will next ask details about the user's profile, start by asking for the user's name.`;
  }
}

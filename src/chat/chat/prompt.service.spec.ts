/* eslint-disable @typescript-eslint/unbound-method */
import { TestingModule } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestingModuleWithDb } from '../../../test/utils';
import { CognitoService } from '../../aws/cognito.service';
import { DrizzleInstanceType, users } from '../../db';
import { DRIZZLE_INSTANCE } from '../../db/drizzle.provider';
import { ChatContextMetadata, PromptService } from './prompt.service';
import { MappedUserResult, ResultService } from './result.service';

describe('PromptService', () => {
  let service: PromptService;
  let resultService: ResultService;
  let cognitoService: CognitoService;
  let dbClient: DrizzleInstanceType;

  const mockUserId = randomUUID();
  const mockEvogenomApiToken = 'token-123';
  const mockChatId = randomUUID();
  const mockLanguageCode = 'en';

  const mockMappedUserResults: MappedUserResult[] = [
    {
      finalProductName: 'Contentful Product 101 Name',
      interpretationText: 'CF Text for P-101, Value 1',
    },
    {
      finalProductName: 'Contentful Product 102 Name',
      interpretationText: 'CF Text for P-102, Value 2',
    },
    {
      finalProductName: 'Evogenom Product Three (No Contentful Product)',
      interpretationText:
        'Your result value is 1, but detailed interpretation is currently unavailable.',
    },
    {
      finalProductName: 'Evogenom Product One',
      interpretationText:
        'Your result value is 99, but detailed interpretation is currently unavailable.',
    },
  ];

  const defaultChatContextMetadata: ChatContextMetadata = {
    currentMessageCount: 1,
    totalHistoryCount: 1,
    userTimeZone: 'UTC',
    scheduledFollowups: [],
    userProfile: null,
    isOnboarded: true,
  };

  beforeEach(async () => {
    resultService = {
      getMappedUserResults: vi.fn().mockResolvedValue(mockMappedUserResults),
    } as unknown as ResultService;

    cognitoService = {
      getUserLanguage: vi.fn().mockResolvedValue(mockLanguageCode),
    } as unknown as CognitoService;

    const module: TestingModule = await createTestingModuleWithDb({
      providers: [
        PromptService,
        {
          provide: ResultService,
          useValue: resultService,
        },
        {
          provide: CognitoService,
          useValue: cognitoService,
        },
      ],
    }).compile();

    service = module.get<PromptService>(PromptService);
    dbClient = module.get<DrizzleInstanceType>(DRIZZLE_INSTANCE);

    await dbClient
      .insert(users)
      .values({ id: mockUserId, timeZone: 'UTC', isOnboarded: false })
      .onConflictDoUpdate({
        target: users.id,
        set: { timeZone: 'UTC', isOnboarded: false },
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemPrompt', () => {
    it('should fetch mapped user results from ResultService', async () => {
      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );
      expect(resultService.getMappedUserResults).toHaveBeenCalledWith(
        mockUserId,
        mockEvogenomApiToken,
      );
    });

    it('should fetch user language from CognitoService', async () => {
      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );
      expect(cognitoService.getUserLanguage).toHaveBeenCalledWith(mockUserId);
    });

    it('should return formatted system prompt by calling formatSystemPrompt with correct data', async () => {
      const spy = vi.spyOn(service, 'formatSystemPrompt');

      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

      expect(spy).toHaveBeenCalledWith(
        mockMappedUserResults,
        expect.objectContaining({
          currentMessageCount: expect.any(Number),
          totalHistoryCount: expect.any(Number),
          userTimeZone: 'UTC',
          scheduledFollowups: expect.any(Array),
          userProfile: null,
          isOnboarded: false,
        }),
        mockLanguageCode,
      );
    });

    it('should correctly reflect isOnboarded status from DB', async () => {
      const spy = vi.spyOn(service, 'formatSystemPrompt');
      await dbClient
        .update(users)
        .set({ isOnboarded: true })
        .where(eq(users.id, mockUserId));

      await service.getSystemPrompt(
        mockUserId,
        mockEvogenomApiToken,
        mockChatId,
      );

      expect(spy).toHaveBeenCalledWith(
        mockMappedUserResults,
        expect.objectContaining({
          isOnboarded: true,
        }),
        mockLanguageCode,
      );
      await dbClient
        .update(users)
        .set({ isOnboarded: false })
        .where(eq(users.id, mockUserId));
    });
  });

  describe('formatSystemPrompt', () => {
    it('should format basic prompt when onboarded', () => {
      const mappedResults: MappedUserResult[] = [];
      const metadata: ChatContextMetadata = {
        ...defaultChatContextMetadata,
        isOnboarded: true,
      };

      const prompt = service.formatSystemPrompt(
        mappedResults,
        metadata,
        mockLanguageCode,
      );
      expect(prompt).toContain('# Your Role & Purpose');
      expect(prompt).not.toContain(
        '# IMPORTANT! Your current task is as follows:',
      );
      expect(prompt).toContain("# User's genotyping results");
      expect(prompt).toContain('Language: You MUST respond in en');
    });

    it('should format onboarding prompt when not onboarded', () => {
      const mappedResults: MappedUserResult[] = [];
      const metadata: ChatContextMetadata = {
        ...defaultChatContextMetadata,
        isOnboarded: false,
        userProfile: null,
      };

      const prompt = service.formatSystemPrompt(
        mappedResults,
        metadata,
        mockLanguageCode,
      );
      expect(prompt).toContain('# IMPORTANT! Your current task is as follows:');
      expect(prompt).not.toContain("# User's genotyping results");
    });

    it('should correctly use MappedUserResult for prompt content', () => {
      const specificMappedResults: MappedUserResult[] = [
        {
          finalProductName: 'CF Product 101',
          interpretationText: 'Text for 101 Value 1',
        },
        {
          finalProductName: 'CF Product 102',
          interpretationText: 'Text for 102 Value 2',
        },
      ];

      const prompt = service.formatSystemPrompt(
        specificMappedResults,
        defaultChatContextMetadata,
        mockLanguageCode,
      );

      expect(prompt).toContain('CF Product 101: Text for 101 Value 1');
      expect(prompt).toContain('CF Product 102: Text for 102 Value 2');
      expect(prompt).toContain("# User's genotyping results");
    });

    it('should include user profile information when available', () => {
      const metadata: ChatContextMetadata = {
        ...defaultChatContextMetadata,
        userProfile: {
          name: 'Test User',
          age: 30,
          gender: 'Male',
          height: 180,
          weight: 75,
          work: 'Engineer',
          physicalActivity: 'Moderate',
        },
      };
      const prompt = service.formatSystemPrompt([], metadata, mockLanguageCode);
      expect(prompt).toContain('# User Profile');
      expect(prompt).toContain('- Name: Test User');
    });

    it('should include scheduled follow-ups when available', () => {
      const metadata: ChatContextMetadata = {
        ...defaultChatContextMetadata,
        scheduledFollowups: [
          {
            id: 'fu1',
            dueDate: '2023-10-27 10:00',
            content: 'Check in on hydration',
          },
        ],
      };
      const prompt = service.formatSystemPrompt([], metadata, mockLanguageCode);
      expect(prompt).toContain('# Scheduled Follow-ups');
      expect(prompt).toContain(
        '- Follow-up ID: fu1, Due: 2023-10-27 10:00 Content: Check in on hydration',
      );
    });
  });
});

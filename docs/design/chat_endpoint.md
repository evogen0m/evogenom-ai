# Chat endpoint

## Authentication

@app/routers/auth.py has an endpoint that returns an ephemeracl token that can be included as query parameter for the chat endpoint. This token allows the user to open websocket connection without.

Auth endpoint checks the Bearer token agains incognito oauth endpoint and authorizes the user.

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const asanaClientId = process.env.ASANA_CLIENT_ID!
  const redirectUri = process.env.ASANA_REDIRECT_URI!

  // Generate OAuth URL
  const authUrl = `https://app.asana.com/-/oauth_authorize?client_id=${asanaClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=random_state_string`

  return NextResponse.redirect(authUrl)
}
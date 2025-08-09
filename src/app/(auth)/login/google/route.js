import {google} from "@/auth";
import {generateCodeVerifier, generateState} from "arctic";
import {cookies} from "next/headers";

export async function GET() {
  
  const state=generateState()
  const codeVerifier=generateCodeVerifier();
  const url= google.createAuthorizationURL(state, codeVerifier, [ "profile","email", "openid" ]);,
    

  cookies().set("google_oauth_state",state,{
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV==="production",
    maxAge: 60*5, // 5 minutes
    someSite: "lax", // cookie configuration
  })
  cookies().set("google_code_verifier",codeVerifier,{
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV==="production",
    maxAge: 60*5, 
    sameSite: "lax", 
  })
  return Response.redirect(null, {
     status: 302,
      headers: {
        Location: url.toString(),
      }
  });
}
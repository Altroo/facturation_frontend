import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {z} from "zod";
import {allowAnyInstance} from "@/utils/helpers";
import {postApi} from "@/store/services/_init/_initAPI";
import {AccountPostLoginResponseType} from "@/types/account/accountTypes";

export const {handlers, auth} = NextAuth({
  providers: [
    Credentials({
      type: "credentials",
      name: "credentials",
      credentials: {
        email: {label: "Email", type: "email", placeholder: "email"},
        password: {label: "Password", type: "password", placeholder: "password"},
      },
      async authorize(credentials) {
        const validatedCredentials = z.object({
          email: z.email(),
          password: z.string(),
        }).safeParse(credentials);

        if (!validatedCredentials.success) {
          return null;
        }

        const {email, password} = validatedCredentials.data;
        const url = `${process.env.NEXT_PUBLIC_ACCOUNT_LOGIN}`;

        try {
          const instance = allowAnyInstance();
          const response: AccountPostLoginResponseType = await postApi(url, instance, {
            email,
            password,
          });

          if (response.status === 200) {
            return {
              pk: response.data.user.pk,
              email: response.data.user.email,
              name: response.data.user.first_name + " " + response.data.user.last_name,
              image: null,
              user: response.data.user,
              access: response.data.access,
              access_expiration: response.data.access_expiration,
              refresh: response.data.refresh,
              refresh_expiration: response.data.refresh_expiration,
            };
          } else {
            return null;
          }
        } catch (e) {
          console.log("Login error", e);
        }

        return null;
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set securely
  session: {
    strategy: "jwt", // Persist the session using JWTs
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 60 * 60, // Update JWT every 1 hour
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "login",
    error: "login",
  },

  callbacks: {
    async signIn({user, account}) {
      if (account) {
        if (account.provider === "credentials") {
          account.user = user.user;
          account.access = user.access;
          account.refresh = user.refresh;
          account.access_expiration = user.access_expiration;
          account.refresh_expiration = user.refresh_expiration;
          return true;
        }
        return false;
      }
      return false;
    },

    async jwt({token, account, user}) {
      if (account && user) {
        // On initial login
        token.access = user.access; // access token
        token.refresh = user.refresh; // refresh token
        token.access_expiration = user.access_expiration;
        token.refresh_expiration = user.refresh_expiration;
        token.user = user.user; // user object
      }

      // Perform refresh token logic if the access token is expired
      if (Date.now() >= (token.access_expiration ? Number(token.access_expiration) : 0)) {
        try {
          // Call your refresh token API if necessary
          const instance = allowAnyInstance();
          const refreshed = await postApi(`${process.env.NEXT_PUBLIC_ACCOUNT_REFRESH_TOKEN}`, instance, {
            refresh: token.refresh,
          });

          if (refreshed.status === 200) {
            token.access = refreshed.data.accessToken;
            token.access_expiration = refreshed.data.accessTokenExpires;
            token.refresh = refreshed.data.refresh ?? token.refresh; // Fallback to the old refresh token if not updated
          }
        } catch (err) {
          console.error("Failed to refresh token:", err);
        }
      }
      return token;
    },

    async session({session, token}) {
      session.accessToken = token.access as string;
      session.refreshToken = token.refresh as string;
      session.accessTokenExpiration = token.access_expiration as string;
      session.refreshTokenExpiration = token.refresh_expiration as string;
      session.user = token.user;
      return session;
    },
  },
  // cookies: {
  //   sessionToken: {
  //     name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   },
  //   callbackUrl: {
  //     name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
  //     options: {
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   },
  //   csrfToken: {
  //     name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   },
  //   pkceCodeVerifier: {
  //     name: "next-auth.pkce.code_verifier",
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       maxAge: 900,
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   },
  //   state: {
  //     name: "next-auth.state",
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       maxAge: 900,
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   },
  //   nonce: {
  //     name: "next-auth.nonce",
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'lax',
  //       path: "/",
  //       secure: process.env.NODE_ENV !== 'development',
  //       // domain: `${process.env.NEXT_BACKEND_DOMAIN}`,
  //     }
  //   }
  // },
  debug: true,
});

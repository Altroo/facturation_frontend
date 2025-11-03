import React from "react";
import type { Metadata } from "next";
import "@/styles/globals.sass";
import {AppRouterCacheProvider} from '@mui/material-nextjs/v15-appRouter';
import SessionProvider from "@/providers/sessionProvider";
import StoreProvider from "@/providers/storeProvider";
import {AppProps} from "next/app";
import {InitContextProvider} from "@/contexts/InitContext";
import {auth} from "@/auth";


export const metadata: Metadata = {
  title: "Facturation - Casa Di Lusso",
  description: "",
  icons: {
    icon: '/favicon.ico',
  },
};

interface EntryPointProps extends AppProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<EntryPointProps> = async (props) => {
  const session = await auth();
  return (
    <html lang="fr">
    <body>
    <SessionProvider session={session}>
      <StoreProvider>
        <InitContextProvider>
          <AppRouterCacheProvider>
            {props.children}
          </AppRouterCacheProvider>
        </InitContextProvider>
      </StoreProvider>
    </SessionProvider>
    </body>
    </html>
  );
}

export default RootLayout;
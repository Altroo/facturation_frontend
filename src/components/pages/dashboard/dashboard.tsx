"use client";

import React from "react";
import {Button, Typography, Stack, ThemeProvider} from "@mui/material";
import {getDefaultTheme} from "@/utils/themes";
import UserMainNavigationBar from "@/components/layouts/userMainNavigationBar/userMainNavigationBar";
import type { AppSession } from "@/types/_init/_initTypes";
// import {getAccessTokenFromSession} from "@/store/session";
// import {useGetProfilQuery} from "@/store/services/account/account";

type Props = { session?: AppSession };

const DashboardClient: React.FC<Props> = ({ session }: Props) => {
  // const token = getAccessTokenFromSession(session);
  // const { data: user, isLoading, error } = useGetProfilQuery(token, { skip: !token });
  return (
    <ThemeProvider theme={getDefaultTheme()}>
      <Stack direction="column">
        <UserMainNavigationBar />
      </Stack>
    </ThemeProvider>
  );
};

export default DashboardClient;
"use client";

import {NextPage} from "next";
import {Button, Typography, Stack} from "@mui/material";
import { ThemeProvider } from '@mui/system';
import {getDefaultTheme} from "@/utils/themes";
import UserMainNavigationBar from "@/components/layouts/userMainNavigationBar/userMainNavigationBar";

const DashboardClient: NextPage = () => {

  return (
    <ThemeProvider theme={getDefaultTheme()}>
      <Stack direction="column">
        <UserMainNavigationBar />
      </Stack>
    </ThemeProvider>
  );
};

export default DashboardClient;
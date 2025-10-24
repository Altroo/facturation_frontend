"use client";

import {signOut, useSession} from "next-auth/react";
import {NextPage} from "next";
import {Button, Typography} from "@mui/material";
import {AUTH_LOGIN} from "@/utils/routes";

const Dashboard: NextPage = () => {
  const {data: session} = useSession();

  const logOutHandler = async () => {
    await signOut({redirect: true, redirectTo: AUTH_LOGIN});
  };

  return (
    <>
      {session && session.user && (
        <>
          <Typography variant="h5" gutterBottom>
            Welcome, {session.user.email}
          </Typography>
          <Button variant="contained" color="secondary" onClick={logOutHandler}>
            Logout
          </Button>
        </>
      )}
    </>
  );
};

export default Dashboard;
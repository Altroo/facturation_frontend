"use client";

import React, { ForwardedRef, forwardRef, useEffect, useState } from 'react';
import Styles from './authPageLayout.module.sass';
import { Box, Stack } from '@mui/material';
import TeeshirtSVG from '@/public/assets/images/auth_illu/teeshirt.svg';
import WatchSVG from '@/public/assets/images/auth_illu/watch.svg';
import MessagesSVG from '@/public/assets/images/auth_illu/messages.svg';

type Props = {
  children?: React.ReactNode;
};

export type svgImageType = {
  src: string;
  height: number;
  width: number;
};

const AuthPageLayout = forwardRef<HTMLAnchorElement, Props>((props: Props, ref: ForwardedRef<HTMLAnchorElement>) => {
  const [authIlluRandom, setAuthIlluRandom] = useState<{ image: svgImageType; color: string } | null>(null);

  useEffect(() => {
    if (authIlluRandom === null) {
      const availableAuthBgImages: Array<{ image: svgImageType; color: string }> = [
        {
          image: TeeshirtSVG.src,
          color: '#DBF4EA',
        },
        {
          image: WatchSVG.src,
          color: '#DBE8F4',
        },
        {
          image: MessagesSVG.src,
          color: '#F3DCDC',
        }
      ];
      const randomElement = availableAuthBgImages[Math.floor(Math.random() * availableAuthBgImages.length)];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthIlluRandom(randomElement);
    }
  }, [authIlluRandom]);

  return (
    <main className={Styles.main}>
      <Stack direction="row">
        {/* Left side */}
        <Box
          className={Styles.leftBox}
          sx={{
            background: `url(${authIlluRandom ? authIlluRandom.image : ''}) bottom left no-repeat scroll ${
              authIlluRandom && authIlluRandom.color
            }`,
            msFilter: `progid:DXImageTransform.Microsoft.AlphaImageLoader(src='${
              authIlluRandom ? authIlluRandom.image : ''
            }', sizingMethod='scale')`,
            backgroundSize: 'contain',
          }}
        >
        </Box>
        {/* Right side */}
        <Box className={Styles.rightBox}>
          {/* Children content */}
          {props.children}
        </Box>
      </Stack>
    </main>
  );
});
AuthPageLayout.displayName = 'AuthPageLayout';

export default AuthPageLayout;

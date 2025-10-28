"use client";
import { useMediaQuery } from 'react-responsive';
import { useComponentHydrated } from 'react-hydration-provider';
import { ReactNode } from "react";

type MediaQueryProps = {
  children: ReactNode;
};


export const Desktop = (props: MediaQueryProps) => {
  const hydrated = useComponentHydrated();
  // 'only screen and (min-width: 992px)'
  // const isResponsive = useMediaQuery({ minWidth: 992 });
  const isResponsive = useMediaQuery({ minWidth: 992 }, hydrated ? undefined : { deviceWidth: 992 });
  return isResponsive ? props.children : null;
};
export const TabletAndMobile = (props: MediaQueryProps) => {
  const hydrated = useComponentHydrated();
  // only screen and (max-width: 991px)'
  // const isResponsive = useMediaQuery({ maxWidth: 991 })
  const isResponsive = useMediaQuery({ maxWidth: 991 }, hydrated ? undefined : { deviceWidth: 767 });
  return isResponsive ? props.children : null;
};

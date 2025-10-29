"use client";

import React, { useState, useEffect, MouseEvent, useCallback } from 'react';
import Styles from './userMainNavigationBar.module.sass';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import { Divider, Menu, MenuItem, Skeleton, Stack, ThemeProvider } from '@mui/material';
import {
	getDropDownMenuTheme,
	userMainNavigationBarTheme,
} from '@/utils/themes';
import Image from 'next/image';
import ProfileSVG from '@/public/assets/svgs/mainNavBarIcons/profile.svg';
import DashboardSVG from '@/public/assets/svgs/mainNavBarIcons/dashboard.svg';
import HambourgerMenuSVG from '@/public/assets/svgs/mainNavBarIcons/hambourger-menu.svg';
import LogoutSVG from '@/public/assets/svgs/mainNavBarIcons/logout.svg';
import { useSession, signOut } from 'next-auth/react';
import { useAppSelector } from '@/utils/hooks';
import {
	getUserFirstName,
	getUserLastName,
	getUserProfilAvatar,
} from "@/store/selectors";
import Link from 'next/link';
import {
	AUTH_LOGIN,
	DASHBOARD,
} from '@/utils/routes';
import SideNavDrawer from '../../mobile/sideNavDrawer/sideNavDrawer';
import CloseSVG from '@/public/assets/svgs/navigationIcons/close.svg';
import {cookiesDeleter} from '@/store/services/_init/_initAPI';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';

const UserMainNavigationBar: React.FC = () => {
	const { data: session, status } = useSession();
	const stateAvatar = useAppSelector(getUserProfilAvatar);
	const [navBarPicture, setNavBarPicture] = useState<string | null>(null);
	const firstName = useAppSelector(getUserFirstName);
	const lastName = useAppSelector(getUserLastName);
	const loading = status === 'loading';

	useEffect(() => {
		if (stateAvatar) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setNavBarPicture(stateAvatar);
		}
	}, [stateAvatar]);

	const [profileSubMenuEl, setProfileSubMenuEl] = useState<null | HTMLElement>(null);
	const openProfileSubMenu = Boolean(profileSubMenuEl);
	const [profileSubMenuMobileEl, setProfileSubMenuMobileEl] = useState<null | HTMLElement>(null);
	const openProfileSubMenuMobile = Boolean(profileSubMenuMobileEl);

	const handleProfileSubMenuClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		setProfileSubMenuEl(event.currentTarget);
	}, []);

	const handleProfileSubMenuClose = useCallback(() => {
		setProfileSubMenuEl(null);
	}, []);

	const handleProfileSubMenuMobileClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
		setProfileSubMenuMobileEl(event.currentTarget);
	}, []);

	const handleProfileSubMenuMobileClose = useCallback(() => {
		setProfileSubMenuMobileEl(null);
	}, []);

	const logOutHandler = async () => {
		await cookiesDeleter('/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		});
		await signOut({redirect: true, redirectTo: AUTH_LOGIN});
	};

	const [openMobileDrawer, setOpenMobileDrawer] = useState<boolean>(false);

	return (
		<ThemeProvider theme={userMainNavigationBarTheme()}>
			<Desktop>
				<Box>
					<AppBar position="static" className={Styles.appBar}>
						<Toolbar>
							<Stack direction="row" justifyContent="space-between" width="100%">
								{/*<Image*/}
								{/*	src={QarybSVG}*/}
								{/*	alt=""*/}
								{/*	width="0"*/}
								{/*	height="0"*/}
								{/*	sizes="100vw"*/}
								{/*	className={Styles.logo}*/}
								{/*	onClick={() => {*/}
								{/*		router.push(SITE_ROOT).then();*/}
								{/*	}}*/}
								{/*	style={{ cursor: 'pointer' }}*/}
								{/*/>*/}
							<Stack direction="row" spacing={1}>
									{!loading && session ? (
										<>
											{/* Avatar button (loggedIn) */}
											<IconButton
												aria-label="profile of current user"
												id="my-profile-button"
												aria-controls={openProfileSubMenu ? 'profile-menu' : undefined}
												aria-haspopup="true"
												aria-expanded={openProfileSubMenu ? 'true' : undefined}
												onClick={handleProfileSubMenuClick}
												size="large"
												color="inherit"
											>
												{!navBarPicture ? (
													<Skeleton variant="circular" width={30} height={30} />
												) : (
													<Image
														src={navBarPicture as string}
														alt=""
														width="30"
														height="30"
														sizes="100vw"
														className={Styles.avatarButton}
													/>
												)}
											</IconButton>
											{/* profil sub Menu */}
											<ThemeProvider theme={getDropDownMenuTheme()}>
												<Menu
													id="profile-menu"
													anchorEl={profileSubMenuEl}
													open={openProfileSubMenu}
													onClose={handleProfileSubMenuClose}
													slotProps={{
														root: { 'aria-labelledby': 'my-profile-mobile-button' },
													}}
													keepMounted
												>
													<MenuItem onClick={handleProfileSubMenuClose} className={Styles.menuItem}>
														<Link href={DASHBOARD} className={Styles.anchorWrapper}>
															<Image
																src={DashboardSVG}
																alt=""
																width="0"
																height="0"
																sizes="100vw"
																className={Styles.subMenuIcons}
															/>
															<span>Mon dashboard</span>
														</Link>
													</MenuItem>
													<Divider orientation="horizontal" flexItem />
													<MenuItem onClick={handleProfileSubMenuClose} className={Styles.fadedMenuItem}>
														<Box onClick={logOutHandler} className={Styles.anchorWrapper}>
															<Image
																src={LogoutSVG}
																alt=""
																width="0"
																height="0"
																sizes="100vw"
																className={Styles.subMenuIcons}
															/>
															<span>Se déconnecter</span>
														</Box>
													</MenuItem>
												</Menu>
											</ThemeProvider>
										</>
									) : (
										// Avatar button (user not connected)
										<IconButton
											size="large"
											aria-label="user not connected"
											aria-controls="menu-appbar"
											aria-haspopup="true"
											color="inherit"
										>
											<Link href={AUTH_LOGIN} className={Styles.anchorWrapper}>
												<Image src={ProfileSVG} alt="" width={30} height={30} sizes="100vw" />
											</Link>
										</IconButton>
									)}
								</Stack>
							</Stack>
						</Toolbar>
					</AppBar>
				</Box>
			</Desktop>
			{/* Mobile version */}
			<TabletAndMobile>
				<Box className={Styles.mobileOnly}>
					<AppBar position="static" className={Styles.appBar}>
						<Toolbar className={Styles.toolbar}>
							<IconButton
								edge="start"
								size="large"
								color="inherit"
								aria-label="open drawer"
								className={Styles.hambourgerIconWrapper}
								onClick={() => setOpenMobileDrawer(true)}
							>
								<Image
									src={HambourgerMenuSVG}
									alt=""
									width={24}
									height={24}
									sizes="100vw"
									className={Styles.mobileIcons}
								/>
							</IconButton>
							{/* MOBILE SIDE NAV DRAWER */}
							<SideNavDrawer open={openMobileDrawer} handleClose={() => setOpenMobileDrawer(false)} keepMounted={true}>
								<Stack direction="column" spacing={2}>
									<Stack direction="row" justifyContent="flex-end" paddingX={2} paddingY={2} paddingBottom={0}>
										<Image
											src={CloseSVG}
											width={0}
											height={0}
											sizes="100vw"
											className={Styles.mobileCloseButton}
											alt=""
											onClick={() => setOpenMobileDrawer(false)}
										/>
									</Stack>
									<Box paddingTop="16px" paddingBottom="16px" paddingX="40px">
										<Divider orientation="horizontal" flexItem className={Styles.divider} />
									</Box>
									<Box>
										{!loading && session ? (
											<Stack direction="column" paddingX="40px" paddingY="18px" paddingTop={0} spacing={2}>
												<Stack direction="row" spacing={2} alignItems="center">
													{!navBarPicture ? (
														<Skeleton variant="circular" width={48} height={48} />
													) : (
														<Image
															src={navBarPicture as string}
															alt=""
															width={48}
															height={48}
															sizes="100vw"
															className={Styles.avatarDrawerButton}
														/>
													)}
													<span className={Styles.mobileProfileName}>
														{firstName} {lastName}
													</span>
												</Stack>
												<Link href={DASHBOARD} className={Styles.anchorWrapper}>
													<Image
														src={DashboardSVG}
														alt=""
														width={24}
														height={24}
														sizes="100vw"
														className={Styles.subMenuDrawerIcons}
													/>
													<span className={Styles.mobileAnchorSpan}>Mon dashboard</span>
												</Link>
												<Box paddingTop={1} paddingBottom={1}>
													<Divider orientation="horizontal" flexItem />
												</Box>
												<Box onClick={logOutHandler} className={Styles.anchorWrapper}>
													<Image
														src={LogoutSVG}
														alt=""
														width={24}
														height={24}
														sizes="100vw"
														className={Styles.subMenuDrawerIcons}
													/>
													<span className={Styles.mobileAnchorGraySpan}>Se déconnecter</span>
												</Box>
											</Stack>
										) : (
											<Stack direction="column" paddingX="40px" paddingY="18px" paddingTop={0} spacing={2}>
												<Link href={AUTH_LOGIN} className={Styles.anchorWrapper}>
													<Image
														src={ProfileSVG}
														alt=""
														width={24}
														height={24}
														sizes="100vw"
														className={Styles.subMenuDrawerIcons}
													/>
													<span className={Styles.mobileAnchorSpan}>Connexion</span>
												</Link>
											</Stack>
										)}
									</Box>
								</Stack>
							</SideNavDrawer>
							{/* FIN MOBILE SIDE NAV DRAWER */}
							{/* Mobile top nav bar */}
							<Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
								{!loading && session ? (
									<>
										<IconButton
											aria-label="profile of current user"
											id="my-profile-mobile-button"
											aria-controls={openProfileSubMenuMobile ? 'profile-mobile-menu' : undefined}
											aria-haspopup="true"
											aria-expanded={openProfileSubMenuMobile ? 'true' : undefined}
											onClick={handleProfileSubMenuMobileClick}
										>
											{!navBarPicture ? (
												<Skeleton variant="circular" width={30} height={30} />
											) : (
												<Image
													src={navBarPicture as string}
													alt=""
													width="30"
													height="30"
													sizes="100vw"
													className={Styles.avatarButton}
												/>
											)}
										</IconButton>
										<ThemeProvider theme={getDropDownMenuTheme()}>
											<Menu
												id="profile-mobile-menu"
												anchorEl={profileSubMenuMobileEl}
												open={openProfileSubMenuMobile}
												onClose={handleProfileSubMenuMobileClose}
												slotProps={{
													root: { 'aria-labelledby': 'my-profile-mobile-button' },
												}}
											>
												<MenuItem onClick={handleProfileSubMenuMobileClose} className={Styles.menuItem}>
													<Link href={DASHBOARD} className={Styles.anchorWrapper}>
														<Image
															src={DashboardSVG}
															alt=""
															width="0"
															height="0"
															sizes="100vw"
															className={Styles.subMenuIcons}
														/>
														<span>Mon dashboard</span>
													</Link>
												</MenuItem>
												<Divider orientation="horizontal" flexItem />
												<MenuItem onClick={handleProfileSubMenuMobileClose} className={Styles.fadedMenuItem}>
													<Box onClick={logOutHandler} className={Styles.anchorWrapper}>
														<Image
															src={LogoutSVG}
															alt=""
															width="0"
															height="0"
															sizes="100vw"
															className={Styles.subMenuIcons}
														/>
														<span>Se déconnecter</span>
													</Box>
												</MenuItem>
											</Menu>
										</ThemeProvider>
									</>
								) : (
									<IconButton
										size="large"
										aria-label="account of current user"
										aria-controls="menu-appbar"
										aria-haspopup="true"
										color="inherit"
										className={Styles.iconButton}
									>
										<Link href={AUTH_LOGIN} className={Styles.anchorWrapper}>
											<Image
												src={ProfileSVG}
												alt=""
												width={24}
												height={24}
												sizes="100vw"
												className={Styles.mobileIcons}
											/>
										</Link>
									</IconButton>
								)}
							</Stack>
						</Toolbar>
					</AppBar>
				</Box>
			</TabletAndMobile>
		</ThemeProvider>
	);
};

export default UserMainNavigationBar;

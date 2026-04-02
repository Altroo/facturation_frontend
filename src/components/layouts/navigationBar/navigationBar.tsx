'use client';

import React, { useRef, useState, useMemo } from 'react';
import { styled, ThemeProvider } from '@mui/material/styles';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import {
	Box,
	Drawer,
	ListItemIcon as MenuListItemIcon,
	ListItemText as MenuListItemText,
	Menu,
	MenuItem,
	Toolbar,
	List,
	Typography,
	Divider,
	IconButton,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Button,
	Skeleton,
	Stack,
	Tooltip,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import {
	Menu as MenuIcon,
	ExpandMore as ExpandMoreIcon,
	Logout as LogoutIcon,
	MoreVert as MoreVertIcon,
	Dashboard as DashboardIcon,
	LibraryBooks as LibraryBooksIcon,
	People as PeopleIcon,
	ReceiptLong as ReceiptLongIcon,
	ReceiptLongOutlined as ReceiptLongOutlinedIcon,
	RequestQuote as RequestQuoteIcon,
	LocalShipping as LocalShippingIcon,
	Payment as PaymentIcon,
	Domain as DomainIcon,
	Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppSelector, useLanguage } from '@/utils/hooks';
import { getProfilState } from '@/store/selectors';
import { cookiesDeleter } from '@/utils/apiHelpers';
import LanguageSwitcher from '@/components/shared/languageSwitcher/languageSwitcher';
import type { TranslationDictionary } from '@/types/languageTypes';
import {
	ARTICLES_ARCHIVED,
	ARTICLES_LIST,
	AUTH_LOGIN,
	BACKEND_SITE_ADMIN,
	BON_DE_LIVRAISON_LIST,
	BON_DE_LIVRAISON_UNINVOICED,
	CLIENTS_ARCHIVED,
	CLIENTS_LIST,
	COMPANIES_ADD,
	COMPANIES_LIST,
	DASHBOARD,
	DASHBOARD_EDIT_PROFILE,
	DASHBOARD_PASSWORD,
	DASHBOARD_OBJECTIFS_MENSUELS,
	DEVIS_LIST,
	FACTURE_CLIENT_LIST,
	FACTURE_CLIENT_UNPAID,
	FACTURE_PRO_FORMA_LIST,
	REGLEMENTS_LIST,
	SITE_ROOT,
	USERS_ADD,
	USERS_LIST,
} from '@/utils/routes';
import { signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { navigationBarTheme } from '@/utils/themes';
import Image from 'next/image';
import Link from 'next/link';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';

const getNavigationMenu = (isStaff: boolean, t: TranslationDictionary) => {
	return {
		dashboard: {
			title: t.navigation.dashboard,
			icon: <DashboardIcon />,
			items: [{ title: t.navigation.dashboard, label: t.navigation.viewDashboard, path: DASHBOARD }],
		},
		articles: {
			title: t.navigation.articles,
			icon: <LibraryBooksIcon />,
			items: [
				{ title: t.navigation.articlesList, label: t.navigation.articlesList, path: ARTICLES_LIST },
				{ title: t.navigation.articlesArchived, label: t.navigation.articlesArchived, path: ARTICLES_ARCHIVED },
			],
		},
		clients: {
			title: t.navigation.clients,
			icon: <PeopleIcon />,
			items: [
				{ title: t.navigation.clientsList, label: t.navigation.clientsList, path: CLIENTS_LIST },
				{ title: t.navigation.clientsArchived, label: t.navigation.clientsArchived, path: CLIENTS_ARCHIVED },
			],
		},
		devis: {
			title: t.navigation.devis,
			icon: <RequestQuoteIcon />,
			items: [{ title: t.navigation.devisList, label: t.navigation.devisList, path: DEVIS_LIST }],
		},
		factures_proformat: {
			title: t.navigation.facturesProforma,
			icon: <ReceiptLongOutlinedIcon />,
			items: [{ title: t.navigation.facturesProformaList, label: t.navigation.facturesProformaList, path: FACTURE_PRO_FORMA_LIST }],
		},
		factures: {
			title: t.navigation.facturesClient,
			icon: <ReceiptLongIcon />,
			items: [
				{ title: t.navigation.facturesClientList, label: t.navigation.facturesClientList, path: FACTURE_CLIENT_LIST },
				{ title: t.navigation.facturesImpayees, label: t.navigation.facturesImpayees, path: FACTURE_CLIENT_UNPAID },
			],
		},
		bonsLivraison: {
			title: t.navigation.bonsLivraison,
			icon: <LocalShippingIcon />,
			items: [
				{ title: t.navigation.bonsLivraisonList, label: t.navigation.bonsLivraisonList, path: BON_DE_LIVRAISON_LIST },
				{ title: t.navigation.bonsLivraisonUninvoiced, label: t.navigation.bonsLivraisonUninvoiced, path: BON_DE_LIVRAISON_UNINVOICED },
			],
		},
		reglement: {
			title: t.navigation.reglement,
			icon: <PaymentIcon />,
			items: [{ title: t.navigation.reglementsList, label: t.navigation.reglementsList, path: REGLEMENTS_LIST }],
		},
		...(isStaff && {
			societe: {
				title: t.navigation.companies,
				icon: <DomainIcon />,
				items: [
					{ title: t.navigation.companiesList, label: t.navigation.companiesList, path: COMPANIES_LIST },
					{ title: t.navigation.newCompany, label: t.navigation.newCompany, path: COMPANIES_ADD },
				],
			},
			utilisateurs: {
				title: t.navigation.users,
				icon: <PeopleIcon />,
				items: [
					{ title: t.navigation.usersList, label: t.navigation.usersList, path: USERS_LIST },
					{ title: t.navigation.newUser, label: t.navigation.newUser, path: USERS_ADD },
				],
			},
		}),
		parametres: {
			title: t.navigation.settings,
			icon: <SettingsIcon />,
			items: [
				{ title: t.navigation.myProfile, label: t.navigation.myProfile, path: DASHBOARD_EDIT_PROFILE },
				{ title: t.navigation.changePassword, label: t.navigation.changePassword, path: DASHBOARD_PASSWORD },
				...(isStaff
					? [
							{
								title: t.navigation.monthlyObjectives,
								label: t.navigation.configureMonthlyObjectives,
								path: DASHBOARD_OBJECTIFS_MENSUELS,
							},
						]
					: []),
			],
		},
	};
};

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
	open?: boolean;
}>(({ theme, open }) => ({
	flexGrow: 1,
	paddingTop: theme.spacing(3),
	overflow: 'hidden',
	transition: theme.transitions.create('margin', {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	marginLeft: 0, // default: no shift
	paddingBottom: '5px',

	[theme.breakpoints.up('md')]: {
		marginLeft: open ? 0 : `-${drawerWidth}px`,
		transition: theme.transitions.create('margin', {
			easing: open ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
			duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
		}),
	},
}));

interface AppBarProps extends MuiAppBarProps {
	open?: boolean;
}

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme }) => ({
	transition: theme.transitions.create(['margin', 'width'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen,
	}),
	variants: [
		{
			props: ({ open }) => open,
			style: {
				width: `calc(100% - ${drawerWidth}px)`,
				marginLeft: `${drawerWidth}px`,
				transition: theme.transitions.create(['margin', 'width'], {
					easing: theme.transitions.easing.easeOut,
					duration: theme.transitions.duration.enteringScreen,
				}),
			},
		},
	],
}));

type Props = {
	title: string;
	children: React.ReactNode;
};

const NavigationBar = (props: Props) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [open, setOpen] = useState(!isMobile);
	const { data: session, status } = useSession();
	const { avatar_cropped, first_name, last_name, gender, is_staff } = useAppSelector(getProfilState);
	const { t, language, setLanguage } = useLanguage();
	const navigationMenu = useMemo(() => getNavigationMenu(is_staff, t), [is_staff, t]);
	const moreVertRef = useRef<HTMLButtonElement>(null);
	const [mobileMenuAnchor, setMobileMenuAnchor] = useState<HTMLElement | null>(null);

	const loading = status === 'loading';

	const logOutHandler = async () => {
		await cookiesDeleter('/api/cookies', {
			pass_updated: true,
			new_email: true,
			code: true,
		});
		await signOut({ redirect: true, redirectTo: AUTH_LOGIN });
	};

	const handleDrawerToggle = () => {
		if (isMobile) {
			setOpen(!open);
		}
	};

	const pathname = usePathname();

	// Separate user override from derived default
	const [userExpanded, setUserExpanded] = useState<string | false>(false);

	// Derive default expanded panel from pathname + navigationMenu
	const defaultExpanded: string | false = useMemo(() => {
		const exactMatch = Object.entries(navigationMenu).find(([, section]) =>
			section.items.some((item) => {
				const normalizedPath = item.path.replace(/^https?:\/\/[^/]+/, '');
				return normalizedPath === pathname;
			}),
		);

		if (exactMatch) {
			return `panel-${exactMatch[0]}`;
		}

		let bestMatch: string | null = null;
		let longestMatchLength = 0;

		Object.entries(navigationMenu).forEach(([key, section]) => {
			section.items.forEach((item) => {
				const normalizedPath = item.path.replace(/^https?:\/\/[^/]+/, '');

				// Check if the current pathname starts with this menu item's path
				// This handles /dashboard/companies/4 matching /dashboard/companies/list
				const pathSegments = normalizedPath.split('/').filter(Boolean);
				const currentSegments = pathname.split('/').filter(Boolean);

				// Count how many segments match from the start
				let matchCount = 0;
				for (let i = 0; i < Math.min(pathSegments.length, currentSegments.length); i++) {
					if (pathSegments[i] === currentSegments[i]) {
						matchCount++;
					} else {
						break;
					}
				}

				// Keep track of the best match (longest common path)
				if (matchCount > longestMatchLength && matchCount > 0) {
					longestMatchLength = matchCount;
					bestMatch = key;
				}
			});
		});

		return bestMatch ? `panel-${bestMatch}` : false;
	}, [pathname, navigationMenu]);

	// Final expanded value: user override wins, else default
	const expanded = userExpanded !== false ? userExpanded : defaultExpanded;

	const normalizePath = (url: string) => {
		try {
			return new URL(url, SITE_ROOT).pathname;
		} catch {
			return url;
		}
	};

	const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
		setUserExpanded(isExpanded ? panel : false);
	};

	return (
		<ThemeProvider theme={navigationBarTheme()}>
			<Box sx={{ display: 'flex' }}>
				<AppBar position="fixed" open={open}>
					<Toolbar>
						<Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
							<Stack direction="row" alignItems="center" spacing={1}>
								{isMobile && (
									<IconButton color="inherit" aria-label={t.common.toggleDrawer} onClick={handleDrawerToggle} size="small">
										<MenuIcon />
									</IconButton>
								)}
								<Typography variant="h6" noWrap component="div">
									{props.title}
								</Typography>
							</Stack>
						<Stack direction="row" spacing={1} alignItems="center">
							{!loading && session && (
								<>
									<Desktop>
										<LanguageSwitcher />
										{is_staff && (
											<Button
												variant="text"
												color="inherit"
												href={BACKEND_SITE_ADMIN}
												target="_blank"
												rel="noopener"
												endIcon={<DomainIcon />}
											>
												{t.navigation.administration}
											</Button>
										)}
										<Button variant="text" color="inherit" endIcon={<LogoutIcon />} onClick={logOutHandler}>
											{t.navigation.logout}
										</Button>
									</Desktop>
									<TabletAndMobile>
										<IconButton
											ref={moreVertRef}
											color="inherit"
											aria-label={t.common.moreActions}
											onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
										>
											<MoreVertIcon />
										</IconButton>
										<Menu
											anchorEl={mobileMenuAnchor}
											open={Boolean(mobileMenuAnchor)}
											onClose={() => setMobileMenuAnchor(null)}
											anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
											transformOrigin={{ vertical: 'top', horizontal: 'right' }}
										>
											<MenuItem onClick={() => { setLanguage(language === 'fr' ? 'en' : 'fr'); setMobileMenuAnchor(null); }}>
											<MenuListItemIcon><span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{language === 'fr' ? '🇬🇧' : '🇫🇷'}</span></MenuListItemIcon>
												<MenuListItemText>{language === 'fr' ? 'English' : 'Français'}</MenuListItemText>
											</MenuItem>
											{is_staff && (
												<MenuItem component="a" href={BACKEND_SITE_ADMIN} target="_blank" rel="noopener" onClick={() => setMobileMenuAnchor(null)}>
													<MenuListItemIcon><DomainIcon fontSize="small" /></MenuListItemIcon>
													<MenuListItemText>{t.navigation.administration}</MenuListItemText>
												</MenuItem>
											)}
											<MenuItem onClick={() => { setMobileMenuAnchor(null); void logOutHandler(); }}>
												<MenuListItemIcon><LogoutIcon fontSize="small" /></MenuListItemIcon>
												<MenuListItemText>{t.navigation.logout}</MenuListItemText>
											</MenuItem>
										</Menu>
									</TabletAndMobile>
								</>
							)}
						</Stack>
						</Stack>
					</Toolbar>
				</AppBar>
				<Drawer
					sx={{
						width: drawerWidth,
						flexShrink: 0,
						'& .MuiDrawer-paper': {
							width: drawerWidth,
							boxSizing: 'border-box',
						},
					}}
					variant={isMobile ? 'temporary' : 'persistent'}
					anchor="left"
					open={open}
					onClose={handleDrawerToggle}
				>
					<Divider />
					{/* User Profile Section */}
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'row',
							alignItems: 'center',
							py: 3,
							px: 2,
							gap: 2,
						}}
					>
						{!avatar_cropped ? (
							<Skeleton variant="circular" width={80} height={80} />
						) : (
							<Box
								sx={{
									width: 80,
									height: 80,
									borderRadius: '50%',
									overflow: 'hidden',
								}}
							>
								<Image
									src={avatar_cropped as string}
									alt={`${first_name} ${last_name}`}
									width={80}
									height={80}
									loading="eager"
									style={{ objectFit: 'contain' }}
								/>
							</Box>
						)}
						{/* Text block next to avatar */}
						<Box sx={{ display: 'flex', flexDirection: 'column' }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
								{gender === 'Homme' ? t.navigation.welcomeMale : gender === 'Femme' ? t.navigation.welcomeFemale : t.navigation.welcomeNeutral}
							</Typography>
							<Typography variant="body2" sx={{ color: 'text.secondary' }}>
								{first_name} {last_name}
							</Typography>
						</Box>
					</Box>
					<Divider />
					<List sx={{ p: 0 }}>
						{Object.entries(navigationMenu).map(([key, section]) => (
							<Box key={key} sx={{ display: 'block' }}>
								<Accordion
									expanded={expanded === `panel-${key}`}
									onChange={handleChange(`panel-${key}`)}
									disableGutters
									elevation={0}
									sx={{
										backgroundColor: 'transparent !important',
										boxShadow: 'none !important',
										'&:before': { display: 'none' },
										margin: '0 !important',
									}}
								>
									<Tooltip title={section.title} placement="right" disableHoverListener={open}>
										<AccordionSummary
											expandIcon={open ? <ExpandMoreIcon /> : null}
											sx={[
												{
													minHeight: 48,
													margin: '0 !important',
													px: 2.5,
													'& .MuiAccordionSummary-content': {
														margin: '0 !important',
														display: 'flex',
														alignItems: 'center',
													},
												},
												open ? { justifyContent: 'initial' } : { justifyContent: 'center', px: 2.5 },
											]}
										>
											<Box
												sx={{
													display: 'flex',
													alignItems: 'center',
													width: '100%',
												}}
											>
												<ListItemIcon
													sx={[{ minWidth: 0, justifyContent: 'center' }, open ? { mr: 3 } : { mr: 'auto' }]}
												>
													{section.icon}
												</ListItemIcon>
												<ListItemText primary={section.title} sx={[open ? { opacity: 1 } : { opacity: 0 }]} />
											</Box>
										</AccordionSummary>
									</Tooltip>
									<AccordionDetails sx={{ p: 0, display: open ? 'block' : 'none' }}>
										{section.items.map((item, idx) => (
											<ListItem key={idx} disablePadding>
												<Link
													href={item.path}
													style={{
														textDecoration: 'none',
														color: 'inherit',
														width: '100%',
													}}
												>
													<ListItemButton
														selected={normalizePath(item.path) === pathname}
														sx={{
															pl: open ? 9 : 2,
															minHeight: 48,
															backgroundColor: normalizePath(item.path) === pathname ? '#F0F0F0' : 'transparent',
															'&.Mui-selected': {
																backgroundColor: '#E0E0E0',
																fontWeight: 600,
															},
														}}
													>
														<ListItemText primary={item.label} />
													</ListItemButton>
												</Link>
											</ListItem>
										))}
									</AccordionDetails>
								</Accordion>
							</Box>
						))}
					</List>
				</Drawer>
				<Main open={open}>{props.children}</Main>
			</Box>
		</ThemeProvider>
	);
};

export default NavigationBar;

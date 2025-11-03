import React from 'react';
import { Stack } from '@mui/material';
import Styles from './desktopDashboardSideNav.module.sass';
import ArrowActiveSVG from '@/public/assets/svgs/dashboardIcons/leftSideNavIcons/arrow-active.svg';
import MiniBackSVG from '@/public/assets/svgs/dashboardIcons/leftSideNavIcons/mini-back.svg';
import MonProfilSVG from '@/public/assets/svgs/dashboardIcons/leftSideNavIcons/mon-profil.svg';
import MotDePasseSVG from '@/public/assets/svgs/dashboardIcons/leftSideNavIcons/mot-de-passe.svg';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { DASHBOARD_PASSWORD, DASHBOARD_EDIT_PROFILE, SITE_ROOT } from '@/utils/routes';

export type DesktopSideNavElementType = {
	icon: string;
	text: string;
	current: boolean;
	link: string;
	disabled: boolean;
};

export const DesktopSideNavElement: React.FC<DesktopSideNavElementType> = (props: DesktopSideNavElementType) => {
	return (
		<Stack
			direction="row"
			justifyContent="space-between"
			alignItems="center"
			className={`${props.disabled && Styles.disabledElement}`}
		>
			<Link href={props.link} replace className={`${props.disabled && Styles.disabledCursor}`}>
				<Stack direction="row" spacing={2} alignItems="center">
					<Image src={props.icon} alt="" width="0" height="0" sizes="100vw" className={Styles.mainIcon} />
					<span className={`${props.current ? Styles.selectedElement : Styles.unselectedElement}`}>{props.text}</span>
				</Stack>
			</Link>
			{props.current && (
				<Image src={ArrowActiveSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.arrowIcon} />
			)}
		</Stack>
	);
};

type Props = {
	backText?: string;
	children?: React.ReactNode;
};

const DesktopDashboardSideNav: React.FC<Props> = (props: Props) => {
	const router = useRouter();
	const pathname = usePathname();
	const editProfilPageTarget = DASHBOARD_EDIT_PROFILE.replace(SITE_ROOT, '');
	const passwordPageTarget = DASHBOARD_PASSWORD.replace(SITE_ROOT, '');
	const isEditProfilePage = !!pathname && pathname.endsWith(editProfilPageTarget);
	const isPasswordPage = !!pathname && pathname.endsWith(passwordPageTarget);

	const profilNavElements: Array<DesktopSideNavElementType> = [
		{
			text: 'Mon profil',
			link: DASHBOARD_EDIT_PROFILE,
			icon: MonProfilSVG,
			current: isEditProfilePage,
			disabled: false,
		},
	];

	const parametresNavElements: Array<DesktopSideNavElementType> = [
		{
			text: 'Mot de passe',
			link: DASHBOARD_PASSWORD,
			icon: MotDePasseSVG,
			current: isPasswordPage,
			disabled: false,
		},
	];

	return (
		<Stack direction="column" className={Styles.sideBar}>
			<Stack direction="column" spacing={4}>
				{props.backText && (
					<Stack direction="column">
						<Stack direction="row" justifyContent="space-between">
							<Stack
								className={Styles.topBackNavigationStack}
								direction="row"
								spacing={1}
								onClick={() => router.back()}
								alignItems="center"
							>
								<Image src={MiniBackSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.backIcon} />
								<span className={Styles.backText}>Retour</span>
							</Stack>
						</Stack>
						<span className={Styles.backHeader}>{props.backText}</span>
					</Stack>
				)}
				<Stack direction="column" spacing={4}>
					<Stack direction="column" spacing={2}>
						<span className={Styles.header}>Profil</span>
						<Stack direction="column" spacing={2}>
							{profilNavElements.map((element, index) => {
								return (
									<DesktopSideNavElement
										text={element.text}
										key={index}
										link={element.link}
										icon={element.icon}
										current={element.current}
										disabled={element.disabled}
									/>
								);
							})}
						</Stack>
					</Stack>
					<Stack direction="column" spacing={2}>
						<span className={Styles.header}>Paramètres</span>
						<Stack direction="column" spacing={2}>
							{parametresNavElements.map((element, index) => {
								return (
									<DesktopSideNavElement
										text={element.text}
										key={index}
										link={element.link}
										icon={element.icon}
										current={element.current}
										disabled={element.disabled}
									/>
								);
							})}
						</Stack>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
};

export default DesktopDashboardSideNav;

import React from 'react';
import Styles from '@/styles/auth/reset-password/set-password-complete.module.sass';
import AuthLayout from '@/components/layouts/auth/authLayout';
import { Stack } from '@mui/material';
import Image from 'next/image';
import SuccessIlluSVG from '../../../../../public/assets/images/success-illu.svg';
import PrimaryAnchorButton from '@/components/htmlElements/buttons/primaryAnchorButton/primaryAnchorButton';
import { AUTH_LOGIN } from '@/utils/routes';
import { Desktop, TabletAndMobile } from '@/utils/clientHelpers';

const SetPasswordCompleteClient: React.FC = () => {
	return (
		<>
			<Desktop>
				<div>
					<AuthLayout>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
							<h2 className={Styles.header}>Mot de passe modifié</h2>
							<p className={Styles.subHeader}>Votre mot de passe a été modifier, connectez-vous</p>
							<PrimaryAnchorButton buttonText="Me connecter" active={true} nextPage={AUTH_LOGIN} />
						</Stack>
					</AuthLayout>
				</div>
			</Desktop>
			<TabletAndMobile>
				<div>
					<main className={Styles.main}>
						<Stack direction="column" spacing={4} className={Styles.contentWrapper}>
							<Image src={SuccessIlluSVG} alt="" width="0" height="0" sizes="100vw" className={Styles.logo} />
							<h2 className={Styles.header}>Mot de passe modifié</h2>
							<p className={Styles.subHeader}>Votre mot de passe a été modifier, connectez-vous</p>
						</Stack>
						<div className={Styles.primaryButtonWrapper}>
							<PrimaryAnchorButton buttonText="Me connecter" active={true} nextPage={AUTH_LOGIN} />
						</div>
					</main>
				</div>
			</TabletAndMobile>
		</>
	);
};

export default SetPasswordCompleteClient;

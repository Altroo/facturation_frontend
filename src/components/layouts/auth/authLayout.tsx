'use client';

import React, { ForwardedRef, forwardRef, useState } from 'react';
import Styles from './authLayout.module.sass';
import { Box, Stack } from '@mui/material';
import Image from 'next/image';
import Logo from '../../../../public/assets/images/facturation-logo.png';
import InvoiceSVG from '../../../../public/assets/images/auth_illu/invoice.svg';
import ReceiptSVG from '../../../../public/assets/images/auth_illu/receipt.svg';
import CalculatorSVG from '../../../../public/assets/images/auth_illu/calculator.svg';
import DocumentSVG from '../../../../public/assets/images/auth_illu/document.svg';

type Props = {
	children?: React.ReactNode;
};

export type svgImageType = {
	src: string;
	height: number;
	width: number;
};

const AuthLayout = forwardRef<HTMLAnchorElement, Props>((props: Props, ref: ForwardedRef<HTMLAnchorElement>) => {
	const [authIlluRandom] = useState<{ image: svgImageType; color: string }>(() => {
		const availableAuthBgImages: Array<{ image: svgImageType; color: string }> = [
			{
				image: InvoiceSVG.src,
				color: '#E8F5E9',
			},
			{
				image: ReceiptSVG.src,
				color: '#FFF3E0',
			},
			{
				image: CalculatorSVG.src,
				color: '#E3F2FD',
			},
			{
				image: DocumentSVG.src,
				color: '#F3E5F5',
			},
		];
		return availableAuthBgImages[Math.floor(Math.random() * availableAuthBgImages.length)];
	});

	return (
		<main className={Styles.main} ref={ref}>
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
					<Image src={Logo} alt="E.B.H Facturation - Logo" width="0" height="0" sizes="100vw" className={Styles.logo} />
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
AuthLayout.displayName = 'AuthLayout';

export default AuthLayout;

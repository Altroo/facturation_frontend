'use client';

import React, { useRef } from 'react';
import Styles from './circularAvatarInputFile.module.sass';
import Image from 'next/image';
import AvatarIconSVG from '@/public/assets/svgs/globalIcons/avatar.svg';
import { Stack } from '@mui/material';

type Props = {
	preview: string | ArrayBuffer | null;
	active: boolean;
	setAvatar?: (file: File | null) => void;
	children?: React.ReactNode;
	showText?: boolean;
};

const CircularAvatarInputFile: React.FC<Props> = (props: Props) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setAvatar } = props;

	const avatarInputOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) {
			return;
		}
		if (!setAvatar) {
			return;
		}
		const file = e.target.files[0];
		if (file && file.type.substring(0, 5) === 'image') {
			setAvatar(file);
		} else {
			setAvatar(null);
		}
	};

	// opens hidden avatar input
	const avatarInputOnClickHandler = (e: React.MouseEvent<HTMLDivElement | HTMLSpanElement>) => {
		e.preventDefault();
		if (!fileInputRef.current) {
			return;
		}
		fileInputRef.current.click();
	};

	return (
		<Stack direction="column" spacing={1} justifyContent="center" alignItems="center">
			<div>
				<input
					type="file"
					className={Styles.hiddenFile}
					ref={fileInputRef}
					accept="image/*"
					onChange={(e) => avatarInputOnChangeHandler(e)}
				/>
				<div
					className={`${Styles.avatarContainer} ${props.preview !== null ? Styles.removeBorders : ''}`}
					onClick={(e) => {
						if (props.active) {
							avatarInputOnClickHandler(e);
						}
					}}
				>
					{props.preview && (
						<Image
							src={props.preview as string}
							alt=""
							width={100}
							height={100}
							loading="eager"
							className={`${Styles.previewAvatar} ${Styles.avatarIcon}`}
						/>
					)}
					<Image
						src={AvatarIconSVG}
						alt=""
						width="30"
						height="27"
						loading="eager"
						sizes="100vw"
						className={`${props.preview !== null ? Styles.hideIcon : ''}`}
					/>
				</div>
			</div>
			{props.showText && (
				<span
					className={Styles.addPictureSpan}
					onClick={(e) => {
						if (props.active) {
							avatarInputOnClickHandler(e);
						}
					}}
				>
					Modifier ma photo
				</span>
			)}
		</Stack>
	);
};

export default CircularAvatarInputFile;

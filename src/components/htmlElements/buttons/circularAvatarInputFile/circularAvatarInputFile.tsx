'use client';

import { useRef, type FC, type ChangeEvent, type MouseEvent } from 'react';
import Styles from './circularAvatarInputFile.module.sass';
import Image from 'next/image';
import { AddAPhoto as AddAPhotoIcon } from '@mui/icons-material';
import { Stack } from '@mui/material';
import { useLanguage } from '@/utils/hooks';
import type { CircularAvatarInputFileProps as Props } from '@/types/uiTypes';

const CircularAvatarInputFile: FC<Props> = (props: Props) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setAvatar } = props;
	const { t } = useLanguage();

	const avatarInputOnChangeHandler = (e: ChangeEvent<HTMLInputElement>) => {
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
	const avatarInputOnClickHandler = (e: MouseEvent<HTMLDivElement | HTMLSpanElement>) => {
		e.preventDefault();
		if (!fileInputRef.current) {
			return;
		}
		fileInputRef.current.click();
	};

	return (
		<Stack
			direction="column"
			spacing={1}
			sx={{
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<div>
				<input
					type="file"
					className={Styles.hiddenFile}
					ref={fileInputRef}
					accept="image/*"
					data-testid="avatar-file-input"
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
							alt={t.common.avatarPreview}
							width={100}
							height={100}
							loading="eager"
							className={`${Styles.previewAvatar} ${Styles.avatarIcon}`}
						/>
					)}
					<AddAPhotoIcon
						sx={{ fontSize: 30 }}
						aria-hidden="true"
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
					{t.common.editPhoto}
				</span>
			)}
		</Stack>
	);
};

export default CircularAvatarInputFile;

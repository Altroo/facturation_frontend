'use client';

import { type ChangeEvent, type DragEvent, type FC, useRef, useState } from 'react';
import { Box, Card, CardContent, Chip, Divider, LinearProgress, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
	AttachFile as AttachFileIcon,
	Clear as ClearIcon,
	CloudUpload as CloudUploadIcon,
	Download as DownloadIcon,
	Image as ImageIcon,
	InsertDriveFile as InsertDriveFileIcon,
	PictureAsPdf as PictureAsPdfIcon,
	UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { useLanguage } from '@/utils/hooks';
import PrimaryAnchorButton from '@/components/htmlElements/buttons/primaryAnchorButton/primaryAnchorButton';
import PrimaryLoadingButton from '@/components/htmlElements/buttons/primaryLoadingButton/primaryLoadingButton';
import CustomAutoCompleteSelect from '@/components/formikElements/customAutoCompleteSelect/customAutoCompleteSelect';
import { textInputTheme } from '@/utils/themes';

import type {
	AttachmentRowProps,
	LogistiqueDocumentField,
	LogistiqueDocumentsFormCardProps,
	LogistiqueDocumentsViewCardProps,
} from '@/types/logistiqueTypes';

const inputTheme = textInputTheme();

const fileInputSx = {
	clip: 'rect(0 0 0 0)',
	clipPath: 'inset(50%)',
	height: 1,
	overflow: 'hidden',
	position: 'absolute',
	bottom: 0,
	left: 0,
	whiteSpace: 'nowrap',
	width: 1,
} as const;

const getFilenameFromUrl = (url?: string | null) => {
	if (!url) return '';
	const cleanUrl = url.split('?')[0];
	const filename = cleanUrl.split('/').filter(Boolean).pop() ?? '';
	return decodeURIComponent(filename);
};

const formatFileSize = (size: number | null | undefined) => {
	if (!size) return '';
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (filename: string, mimeType?: string) => {
	const lowerFilename = filename.toLowerCase();
	if (mimeType === 'application/pdf' || lowerFilename.endsWith('.pdf')) {
		return <PictureAsPdfIcon fontSize="small" />;
	}
	if (mimeType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/.test(lowerFilename)) {
		return <ImageIcon fontSize="small" />;
	}
	return <InsertDriveFileIcon fontSize="small" />;
};

const AttachmentRow: FC<AttachmentRowProps> = ({ icon, title, subtitle, actions }) => (
	<Box
		sx={(theme) => ({
			display: 'flex',
			alignItems: 'center',
			gap: 1.5,
			px: 1.5,
			py: 1.25,
			border: '1px solid',
			borderColor: 'divider',
			borderRadius: 1.5,
			bgcolor: 'background.paper',
			transition: theme.transitions.create(['border-color', 'background-color'], {
				duration: theme.transitions.duration.shortest,
			}),
			'&:hover': {
				borderColor: alpha(theme.palette.primary.main, 0.35),
				bgcolor: alpha(theme.palette.primary.main, 0.03),
			},
		})}
	>
		<Box
			sx={(theme) => ({
				width: 36,
				height: 36,
				borderRadius: 1.25,
				display: 'grid',
				placeItems: 'center',
				color: 'primary.main',
				bgcolor: alpha(theme.palette.primary.main, 0.1),
				flexShrink: 0,
			})}
		>
			{icon}
		</Box>
		<Box sx={{ minWidth: 0, flex: 1 }}>
			<Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
				{title}
			</Typography>
			<Typography variant="caption" color="text.secondary" noWrap component="div">
				{subtitle}
			</Typography>
		</Box>
		<Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
			{actions}
		</Stack>
	</Box>
);

const Header: FC<{ count: number }> = ({ count }) => {
	const { t } = useLanguage();
	const countLabel = `${count} ${count > 1 ? t.logistique.attachmentFiles : t.logistique.attachmentFile}`;

	return (
		<Stack
			direction={{ xs: 'column', sm: 'row' }}
			spacing={1.5}
			sx={{
				alignItems: { xs: 'flex-start', sm: 'center' },
				justifyContent: 'space-between',
				p: 3,
				pb: 2,
			}}
		>
			<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
				<Box
					sx={(theme) => ({
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: 'grid',
						placeItems: 'center',
						color: 'primary.main',
						bgcolor: alpha(theme.palette.primary.main, 0.1),
					})}
				>
					<AttachFileIcon />
				</Box>
				<Box>
					<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
						{t.logistique.attachmentsTitle}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						{countLabel}
					</Typography>
				</Box>
			</Stack>
		</Stack>
	);
};

export const LogistiqueDocumentsFormCard: FC<LogistiqueDocumentsFormCardProps> = ({
	items,
	selectedField,
	onSelectedFieldChangeAction,
	onFileChangeAction,
	onClearFileAction,
	isLoading = false,
	accept,
}) => {
	const { t } = useLanguage();
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const selectedItem = items.find((item) => item.field === selectedField) ?? items[0];
	const visibleItems = items.filter((item) => item.file || item.currentUrl);
	const count = visibleItems.length;

	const handleFiles = (files: File[]) => {
		if (!selectedItem || files.length === 0) return;
		onFileChangeAction(selectedItem.field, files[0]);
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		handleFiles(Array.from(event.target.files ?? []));
		event.target.value = '';
	};

	const handleDrop = (event: DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		setIsDragging(false);
		handleFiles(Array.from(event.dataTransfer.files ?? []));
	};

	return (
		<Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
			<CardContent sx={{ p: 0 }}>
				<Header count={count} />
				<Divider />

				<Stack spacing={2} sx={{ p: 3 }}>
					<Stack
						direction={{ xs: 'column', md: 'row' }}
						spacing={1.5}
						sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
					>
						<CustomAutoCompleteSelect
							id="attachment_type"
							size="small"
							label={t.logistique.attachmentLabel}
							placeholder={t.logistique.attachmentLabel}
							theme={inputTheme}
							startIcon={<AttachFileIcon fontSize="small" />}
							items={items.map((item) => ({ value: item.field, code: item.label }))}
							value={selectedItem ? { value: selectedItem.field, code: selectedItem.label } : null}
							onChange={(_, item) => {
								if (item) onSelectedFieldChangeAction(item.value as LogistiqueDocumentField);
							}}
							noOptionsText={t.logistique.noAttachments}
							disabled={isLoading}
							fullWidth
						/>
						<>
							<PrimaryLoadingButton
								buttonText={t.logistique.chooseFiles}
								size="small"
								loading={false}
								active={!isLoading}
								startIcon={<UploadFileIcon />}
								onClick={() => inputRef.current?.click()}
							/>
							<Box
								component="input"
								ref={inputRef}
								type="file"
								accept={accept}
								disabled={isLoading}
								onChange={handleFileChange}
								sx={fileInputSx}
							/>
						</>
					</Stack>

					<Box
						role="button"
						tabIndex={0}
						onClick={() => inputRef.current?.click()}
						onKeyDown={(event) => {
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								inputRef.current?.click();
							}
						}}
						onDragOver={(event) => {
							event.preventDefault();
							setIsDragging(true);
						}}
						onDragLeave={() => setIsDragging(false)}
						onDrop={handleDrop}
						sx={(theme) => ({
							display: 'flex',
							alignItems: 'center',
							gap: 2,
							minHeight: 96,
							px: 2,
							py: 2,
							border: '1px dashed',
							borderColor: isDragging ? 'primary.main' : alpha(theme.palette.text.primary, 0.22),
							borderRadius: 1.5,
							bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.primary.main, 0.025),
							cursor: 'pointer',
							outline: 'none',
							transition: theme.transitions.create(['background-color', 'border-color'], {
								duration: theme.transitions.duration.shortest,
							}),
							'&:focus-visible': {
								borderColor: 'primary.main',
								boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.14)}`,
							},
						})}
					>
						<Box
							sx={(theme) => ({
								width: 46,
								height: 46,
								borderRadius: 1.5,
								display: 'grid',
								placeItems: 'center',
								color: 'primary.main',
								bgcolor: alpha(theme.palette.primary.main, 0.12),
								flexShrink: 0,
							})}
						>
							<CloudUploadIcon />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
								{t.logistique.dropFiles}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{t.logistique.fileHint}
							</Typography>
						</Box>
					</Box>

					{isLoading ? <LinearProgress /> : null}

					{count === 0 ? (
						<Box sx={{ py: 0.5 }}>
							<Typography color="text.secondary">{t.logistique.noAttachments}</Typography>
						</Box>
					) : (
						<Stack spacing={1}>
							{visibleItems.map((item) => {
								const filename = item.file?.name ?? getFilenameFromUrl(item.currentUrl);
								const subtitle = item.file
									? [filename, formatFileSize(item.file.size)].filter(Boolean).join(' · ')
									: [filename, t.logistique.currentDocument].filter(Boolean).join(' · ');

								return (
									<AttachmentRow
										key={item.field}
										icon={getFileIcon(filename, item.file?.type)}
										title={item.label}
										subtitle={subtitle}
										actions={
											<>
												{item.currentUrl && !item.file ? (
													<Tooltip title={t.logistique.downloadDocument}>
														<span>
															<PrimaryAnchorButton
																buttonText={t.logistique.downloadDocument}
																size="small"
																active
																inverted
																iconOnly
																startIcon={<DownloadIcon fontSize="small" />}
																nextPage={item.currentUrl}
																target="_blank"
																rel="noreferrer"
																download={filename || undefined}
																onClick={(event) => event.stopPropagation()}
															/>
														</span>
													</Tooltip>
												) : null}
												{item.file ? (
													<Tooltip title={t.common.delete}>
														<PrimaryLoadingButton
															buttonText={t.common.delete}
															size="small"
															loading={false}
															active={!isLoading}
															inverted
															iconOnly
															startIcon={<ClearIcon fontSize="small" />}
															color="error"
															onClick={(event) => {
																event.stopPropagation();
																onClearFileAction(item.field);
															}}
														/>
													</Tooltip>
												) : null}
											</>
										}
									/>
								);
							})}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

export const LogistiqueDocumentsViewCard: FC<LogistiqueDocumentsViewCardProps> = ({ items, isLoading = false }) => {
	const { t } = useLanguage();
	const attachments = items.filter((item) => item.currentUrl);

	return (
		<Card elevation={2} sx={{ borderRadius: 2, minWidth: 0, flexShrink: 0 }}>
			<CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
				<Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
					<AttachFileIcon color="primary" />
					<Typography variant="h6" sx={{ fontWeight: 700 }}>
						{t.logistique.attachmentsTitle}
					</Typography>
					<Chip
						label={`${attachments.length} ${
							attachments.length > 1 ? t.logistique.attachmentFiles : t.logistique.attachmentFile
						}`}
						size="small"
						variant="outlined"
						sx={{ ml: 'auto !important' }}
					/>
				</Stack>
				<Divider sx={{ mb: { xs: 1.5, md: 2 } }} />

				<Stack spacing={2}>
					{isLoading ? <LinearProgress /> : null}

					{!isLoading && attachments.length === 0 ? (
						<Box sx={{ py: 0.5 }}>
							<Typography variant="body2" color="text.secondary">
								{t.logistique.noAttachments}
							</Typography>
						</Box>
					) : (
						<Stack spacing={1}>
							{attachments.map((item) => {
								const filename = getFilenameFromUrl(item.currentUrl);

								return (
									<AttachmentRow
										key={item.field}
										icon={getFileIcon(filename)}
										title={item.label}
										subtitle={filename || t.logistique.currentDocument}
										actions={
											item.currentUrl ? (
												<Tooltip title={t.logistique.downloadDocument}>
													<span>
														<PrimaryAnchorButton
															buttonText={t.logistique.downloadDocument}
															size="small"
															active
															inverted
															iconOnly
															startIcon={<DownloadIcon fontSize="small" />}
															nextPage={item.currentUrl}
															target="_blank"
															rel="noreferrer"
															download={filename || undefined}
														/>
													</span>
												</Tooltip>
											) : null
										}
									/>
								);
							})}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

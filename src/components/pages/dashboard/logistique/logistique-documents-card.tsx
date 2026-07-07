'use client';

import React, { useRef, useState } from 'react';
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Divider,
	IconButton,
	LinearProgress,
	MenuItem,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
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
import type { LogistiqueDocumentField } from '@/types/logistiqueTypes';

export type LogistiqueDocumentItem = {
	field: LogistiqueDocumentField;
	label: string;
	file?: File | null;
	currentUrl?: string | null;
};

type LogistiqueDocumentsFormCardProps = {
	items: LogistiqueDocumentItem[];
	selectedField: LogistiqueDocumentField;
	onSelectedFieldChange: (field: LogistiqueDocumentField) => void;
	onFileChange: (field: LogistiqueDocumentField, file: File | null) => void;
	onClearFile: (field: LogistiqueDocumentField) => void;
	isLoading?: boolean;
	accept?: string;
};

type LogistiqueDocumentsViewCardProps = {
	items: LogistiqueDocumentItem[];
	isLoading?: boolean;
};

type AttachmentRowProps = {
	icon: React.ReactNode;
	title: string;
	subtitle: string;
	actions: React.ReactNode;
	status?: string;
};

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

const AttachmentRow: React.FC<AttachmentRowProps> = ({ icon, title, subtitle, actions, status }) => (
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
		{status ? <Chip label={status} size="small" color="warning" variant="outlined" sx={{ flexShrink: 0 }} /> : null}
		<Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
			{actions}
		</Stack>
	</Box>
);

const Header: React.FC<{ count: number }> = ({ count }) => {
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

export const LogistiqueDocumentsFormCard: React.FC<LogistiqueDocumentsFormCardProps> = ({
	items,
	selectedField,
	onSelectedFieldChange,
	onFileChange,
	onClearFile,
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
		onFileChange(selectedItem.field, files[0]);
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		handleFiles(Array.from(event.target.files ?? []));
		event.target.value = '';
	};

	const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
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
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { xs: 'stretch', md: 'center' } }}>
						<TextField
							select
							size="small"
							label={t.logistique.attachmentLabel}
							value={selectedItem?.field ?? ''}
							onChange={(event) => onSelectedFieldChange(event.target.value as LogistiqueDocumentField)}
							fullWidth
						>
							{items.map((item) => (
								<MenuItem key={item.field} value={item.field}>
									{item.label}
								</MenuItem>
							))}
						</TextField>
						<Button
							component="label"
							variant="contained"
							startIcon={<UploadFileIcon />}
							disabled={isLoading}
							sx={{ minWidth: { xs: '100%', md: 180 }, whiteSpace: 'nowrap' }}
						>
							{t.logistique.chooseFiles}
							<Box
								component="input"
								ref={inputRef}
								type="file"
								accept={accept}
								disabled={isLoading}
								onChange={handleFileChange}
								sx={fileInputSx}
							/>
						</Button>
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
										status={item.file ? t.logistique.pendingUpload : undefined}
										actions={
											<>
												{item.currentUrl && !item.file ? (
													<Tooltip title={t.logistique.downloadDocument}>
														<IconButton
															aria-label={t.logistique.downloadDocument}
															size="small"
															component="a"
															href={item.currentUrl}
															target="_blank"
															rel="noreferrer"
															download={filename || undefined}
															onClick={(event) => event.stopPropagation()}
														>
															<DownloadIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												) : null}
												{item.file ? (
													<Tooltip title={t.common.delete}>
														<IconButton
															size="small"
															color="error"
															disabled={isLoading}
															onClick={(event) => {
																event.stopPropagation();
																onClearFile(item.field);
															}}
														>
															<ClearIcon fontSize="small" />
														</IconButton>
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

export const LogistiqueDocumentsViewCard: React.FC<LogistiqueDocumentsViewCardProps> = ({ items, isLoading = false }) => {
	const { t } = useLanguage();
	const attachments = items.filter((item) => item.currentUrl);

	return (
		<Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
			<CardContent sx={{ p: 0 }}>
				<Header count={attachments.length} />
				<Divider />

				<Stack spacing={2} sx={{ p: 3 }}>
					{isLoading ? <LinearProgress /> : null}

					{!isLoading && attachments.length === 0 ? (
						<Box sx={{ py: 0.5 }}>
							<Typography color="text.secondary">{t.logistique.noAttachments}</Typography>
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
													<IconButton
														aria-label={t.logistique.downloadDocument}
														size="small"
														component="a"
														href={item.currentUrl}
														target="_blank"
														rel="noreferrer"
														download={filename || undefined}
													>
														<DownloadIcon fontSize="small" />
													</IconButton>
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

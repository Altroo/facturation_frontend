'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
	id: string;
	children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ id, children }) => {
	const [container, setContainer] = useState<HTMLElement | null>(null);

	useEffect(() => {
		let el = document.getElementById(id);
		if (!el) {
			el = document.createElement('div');
			el.id = id;

			el.style.position = 'fixed';
			el.style.bottom = '20px';
			el.style.left = '20px';
			el.style.zIndex = '9999';
			el.style.width = 'auto';
			el.style.maxWidth = '100vw';
			el.style.pointerEvents = 'none';
			el.style.display = 'flex';
			el.style.flexDirection = 'column';
			el.style.alignItems = 'flex-start';

			document.body.appendChild(el);
		}
		setContainer(el);
	}, [id]);

	if (!container) return null;
	return createPortal(children, container);
};

export default Portal;

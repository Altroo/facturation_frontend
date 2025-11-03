'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
	id: string;
	children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ id, children }) => {
	const containerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		let el = document.getElementById(id);
		if (!el) {
			el = document.createElement('div');
			el.id = id;
			document.body.appendChild(el);
		}
		containerRef.current = el;
	}, [id]);

	if (!containerRef.current) return null;
	return createPortal(children, containerRef.current);
};

export default Portal;

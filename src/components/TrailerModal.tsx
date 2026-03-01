import React, { useEffect } from 'react';
import { Modal, ModalContent } from '@heroui/react';

interface TrailerModalProps {
	trailerUrl: string;
	onClose: () => void;
	title?: string;
}

const extractYouTubeId = (url: string): string | null => {
	if (!url) return null;
	const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
	return match ? match[1] : null;
};

const TrailerModal: React.FC<TrailerModalProps> = ({ trailerUrl, onClose, title }) => {
	const videoId = extractYouTubeId(trailerUrl);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				onClose();
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [onClose]);

	if (!videoId) {
		return null;
	}

	return (
		<Modal isOpen={true} onOpenChange={(open) => !open && onClose()} size="4xl" backdrop="blur" classNames={{
			base: "bg-black/90",
			closeButton: "hover:bg-default-100/50 active:bg-default-200/50 text-white z-50",
		}}>
			<ModalContent>
				{(onClose) => (
					<div className="relative pb-[56.25%] w-full h-full">
						<iframe
							className="absolute inset-0 h-full w-full rounded-lg"
							src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
							title={title ? `${title} - Trailer` : 'Trailer'}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					</div>
				)}
			</ModalContent>
		</Modal>
	);
};

export default TrailerModal;

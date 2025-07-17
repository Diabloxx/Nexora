import React from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

const commonEmojis = [
  '👍', '👎', '❤️', '😂', '😢', '😮', '😡', '🎉',
  '🔥', '✨', '⭐', '💯', '💀', '🤔', '👀', '🙌'
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose, position }) => {
  return (
    <div 
      className="absolute z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-3"
      style={{ 
        top: position?.top || 0, 
        left: position?.left || 0,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="grid grid-cols-8 gap-2">
        {commonEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-700 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm w-full text-center"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EmojiPicker;

import React from 'react';
import { UserProfile } from '../types';
import { AuthScreen } from './AuthScreen';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <AuthScreen
      isModal={true}
      onCloseModal={onClose}
      onAuthSuccess={(userProfile) => {
        onLoginSuccess(userProfile);
        onClose();
      }}
    />
  );
};

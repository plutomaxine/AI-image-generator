import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Upload from '../components/Toolkit/Upload';

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Mock Firebase App
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
  })),
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({
    // Mock methods used from Firestore
  })),
  initializeFirestore: jest.fn((app, options) => ({
    // Return a mock Firestore instance
  })),
  CACHE_SIZE_UNLIMITED: jest.fn(),
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve({
    ref: {
      getDownloadURL: jest.fn(() => Promise.resolve("url-to-the-image"))
    }
  })),
  getDownloadURL: jest.fn(() => Promise.resolve("url-to-the-image"))
}));

// Set the global timeout for all tests
jest.setTimeout(10000); // Set timeout to 10 seconds for all tests

//Test case 1
describe('Upload Component', () => {
  test('displays an error message for files larger than 5 MB', async () => {
    const { getByTestId } = render(<Upload files={[]} setFiles={() => { }} setActiveTab={() => { }} />);
    const fileInput = getByTestId('fileInput');

    // Create a mock file that's slightly larger than 5 MB
    const file = new File([new Array(5 * 1024 * 1024 + 1).fill('a').join('')], 'large-file.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    expect(await screen.findByText('One or more files are too large. Please upload files less than 5MB.')).toBeInTheDocument();
  });

  //Test case 2
  test('displays an error message if uploading more than 4 files', async () => {
    const { getByTestId } = render(<Upload files={[]} setFiles={() => { }} setActiveTab={() => { }} />);
    const fileInput = getByTestId('fileInput');

    // Create an array of 5 dummy files
    const files = new Array(5).fill(null).map((_, index) => new File([''], `file${index}.jpg`, { type: 'image/jpeg' }));
    Object.defineProperty(fileInput, 'files', {
      value: files
    });

    fireEvent.change(fileInput);

    expect(await screen.findByText('You can only upload a maximum of 4 images.')).toBeInTheDocument();
  });

  //Test case 3
  test('allows file upload when conditions are met', async () => {
    const { getByTestId } = render(<Upload files={[]} setFiles={() => { }} setActiveTab={() => { }} />);
    const fileInput = getByTestId('fileInput');

    // Create a valid file under 5 MB
    const file = new File([new Array(5 * 1024 * 1024 - 1).fill('a').join('')], 'valid-file.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    // expect(await screen.findByText('Success! Images have been uploaded and are now available in the album.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Success! Images have been uploaded and are now available in the album.')).toBeInTheDocument(), {
      timeout: 50000
    });
  });
});
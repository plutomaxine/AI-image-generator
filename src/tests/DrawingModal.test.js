import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DrawingModal from './DrawingModal';
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import axios from 'axios';

// Mock Firebase functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock Axios
jest.mock('axios');

describe('DrawingModal Component', () => {
  const imageUrl = 'https://example.com/image.jpg';
  const reloadAlbum = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    storageRef.mockClear();
    uploadBytes.mockClear();
    getDownloadURL.mockClear();
    deleteObject.mockClear();
    axios.post.mockClear();
  });

  test('renders DrawingModal component', () => {
    render(<DrawingModal imageUrl={imageUrl} onClose={onClose} reloadAlbum={reloadAlbum} />);
    expect(screen.getByPlaceholderText('Enter your prompt')).toBeInTheDocument();
    expect(screen.getByText('Generate Image')).toBeInTheDocument();
  });

  test('draws on canvas', async () => {
    render(<DrawingModal imageUrl={imageUrl} onClose={onClose} reloadAlbum={reloadAlbum} />);
    const canvas = screen.getByRole('img');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);

    // Add assertions for drawing functionality
  });

  test('handles prompt input and generates image', async () => {
    render(<DrawingModal imageUrl={imageUrl} onClose={onClose} reloadAlbum={reloadAlbum} />);
    const promptInput = screen.getByPlaceholderText('Enter your prompt');
    const generateButton = screen.getByText('Generate Image');

    fireEvent.change(promptInput, { target: { value: 'A beautiful sunset' } });
    fireEvent.click(generateButton);

    // Mock API responses
    const maskImageUrl = 'https://example.com/mask.jpg';
    const generatedImageUrl = 'https://example.com/generated.jpg';

    uploadBytes.mockResolvedValueOnce({});
    getDownloadURL.mockResolvedValueOnce(maskImageUrl);
    axios.post.mockResolvedValueOnce({ data: { image: generatedImageUrl } });

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByAltText('Generated')).toBeInTheDocument());
  });

  test('handles undo action', async () => {
    render(<DrawingModal imageUrl={imageUrl} onClose={onClose} reloadAlbum={reloadAlbum} />);
    const undoButton = screen.getByText('Undo');

    // Perform some drawing actions
    const canvas = screen.getByRole('img');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);

    // Undo the last action
    fireEvent.click(undoButton);

    // Add assertions to check if the last action was undone
  });

  test('handles clear canvas action', async () => {
    render(<DrawingModal imageUrl={imageUrl} onClose={onClose} reloadAlbum={reloadAlbum} />);
    const clearButton = screen.getByText('Clear');

    // Perform some drawing actions
    const canvas = screen.getByRole('img');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas);

    // Clear the canvas
    fireEvent.click(clearButton);

    // Add assertions to check if the canvas was cleared
  });
});

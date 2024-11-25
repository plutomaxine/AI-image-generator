import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Canvas from './Canvas';
import { storage } from '../../config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Mock Firebase functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

describe('Canvas Component', () => {
  beforeEach(() => {
    storageRef.mockClear();
    uploadBytes.mockClear();
    getDownloadURL.mockClear();
  });

  test('renders Canvas component', () => {
    render(<Canvas />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  test('draws on canvas', () => {
    render(<Canvas />);
    const canvas = screen.getByRole('img');
    const context = canvas.getContext('2d');
    const drawSpy = jest.spyOn(context, 'lineTo');
    
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    expect(drawSpy).toHaveBeenCalled();
    expect(drawSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number));
  });

  test('handles undo action', () => {
    render(<Canvas />);
    const undoButton = screen.getByText('Undo');

    const canvas = screen.getByRole('img');
    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    fireEvent.click(undoButton);

    // Add assertions to check if the last action was undone
  });

  test('handles clear canvas action', () => {
    render(<Canvas />);
    const clearButton = screen.getByText('Clear');

    const canvas = screen.getByRole('img');
    const context = canvas.getContext('2d');
    const clearSpy = jest.spyOn(context, 'clearRect');

    fireEvent.click(clearButton);

    expect(clearSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
  });

  test('uploads sketch', async () => {
    render(<Canvas />);
    const uploadButton = screen.getByText('Upload');
    const canvas = screen.getByRole('img');
    const context = canvas.getContext('2d');
    const toBlobSpy = jest.spyOn(canvas, 'toBlob');

    fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    fireEvent.click(uploadButton);

    await waitFor(() => expect(toBlobSpy).toHaveBeenCalled());
    await waitFor(() => expect(uploadBytes).toHaveBeenCalled());
    await waitFor(() => expect(getDownloadURL).toHaveBeenCalled());
  });
});

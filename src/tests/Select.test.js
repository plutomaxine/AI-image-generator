import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Select from './Select';
import { ref, listAll, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from '../../config/firebase.js';

jest.mock('firebase/storage');

// Mocking the firebase storage functions
const mockImages = [
  { name: 'image1.jpg', url: 'https://example.com/image1.jpg', timeCreated: '2024-01-01T00:00:00Z', customMetadata: { Original_File_Name: 'image1.jpg' } },
  { name: 'image2.jpg', url: 'https://example.com/image2.jpg', timeCreated: '2024-01-02T00:00:00Z', customMetadata: { Original_File_Name: 'image2.jpg' } }
];

listAll.mockResolvedValue({
  items: mockImages.map(image => ({
    ...image,
    getMetadata: async () => ({ customMetadata: image.customMetadata, timeCreated: image.timeCreated }),
    getDownloadURL: async () => image.url,
  }))
});

describe('Select Component', () => {
  test('renders and loads images', async () => {
    render(<Select />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for images to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Check if images are displayed
    mockImages.forEach(image => {
      expect(screen.getByAltText(`Album Item ${mockImages.indexOf(image)}`)).toHaveAttribute('src', image.url);
    });
  });

  test('filters images based on search query', async () => {
    render(<Select />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'image1' } });

    // Check if the correct image is displayed
    expect(screen.getByAltText('Album Item 0')).toBeInTheDocument();
    expect(screen.queryByAltText('Album Item 1')).not.toBeInTheDocument();
  });

  test('opens drawing modal when modify button is clicked', async () => {
    render(<Select />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    const modifyButton = screen.getAllByText(/modify/i)[0];
    fireEvent.click(modifyButton);

    // Check if the DrawingModal component is displayed
    expect(screen.getByText(/drawing modal/i)).toBeInTheDocument();
  });
});

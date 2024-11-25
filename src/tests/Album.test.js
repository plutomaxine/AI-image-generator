import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Album from '../components/Toolkit/Album';

import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';

// Mocking 'firebase/storage'
jest.mock('firebase/storage', () => ({
    ref: jest.fn(() => ({
        listAll: jest.fn(() => Promise.resolve({
            items: [
                { name: 'image1.jpg' },
                { name: 'image2.jpg' } 
            ]
        })),
        getDownloadURL: jest.fn((ref) => Promise.resolve(`url-to-${ref.name}`)),
        getMetadata: jest.fn(() => Promise.resolve({
            customMetadata: { Original_File_Name: 'Original Name' }
        }))
    })),
    getStorage: jest.fn(() => ({
        ref: jest.fn().mockReturnThis(),
    }))
}));

//Test case 1
test('fetches images on initial render and displays them', async () => {
    const { findByAltText } = render(<Album />);

    const image1 = await findByAltText('Album Item 0');
    expect(image1).toBeInTheDocument();
    expect(image1.src).toContain('url-to-image1.jpg');
});

//Test case 2
test('filters images based on search query', async () => {
    const { getByPlaceholderText, getByAltText, queryByAltText } = render(<Album />);

    const searchInput = getByPlaceholderText('Search by uploaded file name');
    fireEvent.change(searchInput, { target: { value: 'image1' } });

    await waitFor(() => {
        expect(getByAltText('Album Item 0')).toBeInTheDocument();
        expect(queryByAltText('Album Item 1')).toBeNull();
    });
});

//Test case 3
test('removes an image when delete button is clicked', async () => {
    const { getByText, queryByText } = render(<Album />);

    const deleteButton = getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
        expect(queryByText('Image successfully removed.')).toBeInTheDocument();
    });
});  

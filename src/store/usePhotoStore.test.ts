import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoStore } from './usePhotoStore';
import { DEFAULT_TEMPLATES } from '../types/photo';

describe('usePhotoStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePhotoStore.setState({
      templates: DEFAULT_TEMPLATES,
      selectedTemplate: DEFAULT_TEMPLATES[0],
      photos: [],
      galleryPhotos: [],
      editingImageUrl: null,
    });
  });

  it('should initialize with default templates', () => {
    const state = usePhotoStore.getState();
    expect(state.templates).toEqual(DEFAULT_TEMPLATES);
    expect(state.selectedTemplate).toEqual(DEFAULT_TEMPLATES[0]);
    expect(state.photos).toEqual([]);
    expect(state.galleryPhotos).toEqual([]);
    expect(state.editingImageUrl).toBeNull();
  });

  it('should update selected template', () => {
    const newTemplate = DEFAULT_TEMPLATES[1];
    usePhotoStore.getState().setSelectedTemplate(newTemplate);
    expect(usePhotoStore.getState().selectedTemplate).toEqual(newTemplate);
  });

  it('should update photos', () => {
    const newPhotos = [
      {
        id: '1',
        originalUrl: 'test.jpg',
        croppedUrl: 'test.jpg',
        quantity: 1,
        zoom: 1,
        rotation: 0,
      },
    ];
    usePhotoStore.getState().setPhotos(newPhotos);
    expect(usePhotoStore.getState().photos).toEqual(newPhotos);
  });

  it('should update editing image url', () => {
    const url = 'blob:test';
    usePhotoStore.getState().setEditingImageUrl(url);
    expect(usePhotoStore.getState().editingImageUrl).toEqual(url);
  });
});

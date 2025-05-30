import React, { useState, useEffect } from 'react';
import Table from '../common/Table';
import LocalImage from '../common/LocalImage';
import ImageViewer from '../common/ImageViewer';
import LocalImageUploader from '../common/LocalImageUploader';
import LocalImageService from '../../utils/LocalImageService';
import '../../styles/unifié.css';

import API from '../../api'; 

const AdminClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomType, setRoomType] = useState('classroom'); // 'classroom' or 'studyRoom'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    capacity: '',
    features: '',
    availableTimes: '',
    image: '/images/classrooms/classroom-default.jpg' // Default image path
  });
  
  // Charger les salles depuis l'API au montage du composant
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        // Utiliser l'API directement
        const classroomsResponse = await API.get('/api/rooms/classrooms');
        console.log("Classrooms response:", classroomsResponse);
        setClassrooms(classroomsResponse.data);
    
        setError(null);
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError("Failed to load rooms from server. Loading from local storage instead.");
        
        // Fallback to localStorage if API fails
        const storedClassrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
        
        setClassrooms(storedClassrooms);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
  // Gérer les changements des champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Gérer les changements pour les fonctionnalités (liste séparée par des virgules)
  const handleFeaturesChange = (e) => {
    setFormData({
      ...formData,
      features: e.target.value
    });
  };
  
  // Handle image selection from the uploader
  const handleImageSelect = (e) => {
    setFormData({
      ...formData,
      image: e.target.value
    });
  };
  
  // Ouvrir la modal pour ajouter une nouvelle salle
  const openAddModal = (type) => {
    setModalMode('add');
    setRoomType(type);
    setFormData({
      id: '',
      name: '',
      type: type === 'classroom' ? 'Lecture Hall' : 'study',
      capacity: '',
      features: '',
      availableTimes: '8AM - 9PM',
      image: '/images/classrooms/classroom-default.jpg' // Default image
    });
    setShowModal(true);
  };
  
  // Ouvrir la modal pour modifier une salle existante
  const openEditModal = (room, type) => {
    setModalMode('edit');
    setRoomType(type);
    setSelectedRoom(room);
    
    if (type === 'classroom') {
      setFormData({
        id: room.id || '',
        name: room.roomNumber || '',
        type: room.type || '',
        capacity: room.capacity || '',
        features: Array.isArray(room.features) ? room.features.join(', ') : (room.features || ''),
        image: room.image || '/images/classrooms/classroom-default.jpg'
      });
    } 
    
    setShowModal(true);
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (roomType === 'classroom') {
        await handleClassroomSubmit();
      }
      
      setShowModal(false);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Failed to save room data. Please try again.");
    }
  };
  
 // Replace the handleClassroomSubmit method in AdminClassrooms.js with this improved version:

const handleClassroomSubmit = async () => {
  const featuresList = formData.features.split(',').map(feature => feature.trim());
  
  // Format selon la structure ClassroomDTO de votre backend Java
  const classroomData = {
    id: formData.id || null,
    roomNumber: formData.name,
    type: formData.type,
    capacity: parseInt(formData.capacity),
    features: featuresList,
    image: formData.image
  };
  
  console.log("Données envoyées:", classroomData);
  
  if (modalMode === 'add') {
    try {
      const response = await API.post('/api/rooms/classrooms', classroomData);
      console.log("Réponse du backend après création:", response.data);
      
      const newClassroom = response.data;
      setClassrooms([...classrooms, newClassroom]);
      
      // Also update localStorage as backup
      const updatedClassrooms = [...classrooms, newClassroom];
      localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
      
      alert('Classroom added successfully.');
    } catch (err) {
      console.error("API error details:", err.response || err);
      
      // Check if it's a validation error from the backend
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.message) {
        // This is a validation error (like duplicate room number)
        alert(`Error: ${err.response.data.message}`);
        return; // Don't fall back to localStorage for validation errors
      }
      
      // Check for other client errors (401, 403, etc.)
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        alert(`Error: ${err.response.data?.message || 'Invalid request. Please check your input.'}`);
        return;
      }
      
      // Only fall back to localStorage for network/server errors
      if (!err.response || err.response.status >= 500) {
        const newClassroom = {
          ...classroomData,
          id: `C${Date.now().toString().substr(-4)}`,
        };
        
        const updatedClassrooms = [...classrooms, newClassroom];
        setClassrooms(updatedClassrooms);
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Server unavailable. Classroom added to local storage (offline mode).');
      }
    }
  } else {
    // Edit mode
    try {
      const response = await API.put(`/api/rooms/classrooms/${selectedRoom.id}`, classroomData);
      console.log("Réponse du backend après mise à jour:", response.data);
      
      const updatedClassroom = response.data;
      
      const updatedClassrooms = classrooms.map(classroom => {
        if (classroom.id === selectedRoom.id) {
          return updatedClassroom;
        }
        return classroom;
      });
      
      setClassrooms(updatedClassrooms);
      localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
      
      alert('Classroom updated successfully.');
    } catch (err) {
      console.error("API error details:", err.response || err);
      
      // Check if it's a validation error from the backend
      if (err.response && err.response.status === 400 && err.response.data && err.response.data.message) {
        alert(`Error: ${err.response.data.message}`);
        return;
      }
      
      // Check for other client errors
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        alert(`Error: ${err.response.data?.message || 'Invalid request. Please check your input.'}`);
        return;
      }
      
      // Only fall back to localStorage for network/server errors
      if (!err.response || err.response.status >= 500) {
        const updatedClassrooms = classrooms.map(classroom => {
          if (classroom.id === selectedRoom.id) {
            return {
              ...classroom,
              roomNumber: formData.name,
              type: formData.type,
              capacity: parseInt(formData.capacity),
              features: featuresList,
              image: formData.image
            };
          }
          return classroom;
        });
        
        setClassrooms(updatedClassrooms);
        localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        
        alert('Server unavailable. Classroom updated in local storage (offline mode).');
      }
    }
  }
};
  // Gérer la suppression d'une salle
  const handleDeleteRoom = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        // Find the room first to get its image
        const roomToDelete = classrooms.find(room => room.id === id);
        
        if (type === 'classroom') {
          // Utiliser l'API directement
          await API.delete(`/api/rooms/classrooms/${id}`);
          console.log("Classroom deleted on backend:", id);
          
          // If the room had a localStorage image, delete it too
          if (roomToDelete && roomToDelete.image && roomToDelete.image.startsWith('local-storage://')) {
            LocalImageService.deleteImage(roomToDelete.image);
          }
          
          // Update local state
          const updatedClassrooms = classrooms.filter(classroom => classroom.id !== id);
          setClassrooms(updatedClassrooms);
          
          // Also update localStorage
          localStorage.setItem('availableClassrooms', JSON.stringify(updatedClassrooms));
        } 
        
        alert('Room deleted successfully.');
      } catch (err) {
        console.error("API error details:", err.response || err);
      }
    }
  };
  
 // Update these two parts in your AdminClassrooms.js file:

// 1. In the classroomColumns array, update the Image column:
const classroomColumns = [
  { header: 'ID', key: 'id' },
  { header: 'Room Number', key: 'roomNumber' },
  { header: 'Type', key: 'type' },
  { header: 'Capacity', key: 'capacity' },
  { 
    header: 'Features', 
    key: 'features',
    render: (features) => Array.isArray(features) ? features.join(', ') : features
  },
  {
    header: 'Image',
    key: 'image',
    render: (image) => (
      <div className="table-image-preview">
        <ImageViewer 
          src={image} 
          alt="Classroom" 
          previewStyle={{width: '50px', height: '40px'}}
          clickable={false} // ADD THIS LINE - Disables enlargement
        />
      </div>
    )
  },
  {
    header: 'Actions',
    key: 'id',
    render: (id, classroom) => (
      <div className="table-actions">
        <button 
          className="btn-table btn-edit"
          onClick={() => openEditModal(classroom, 'classroom')}
        >
          Edit
        </button>
        <button 
          className="btn-table btn-delete"
          onClick={() => handleDeleteRoom(id, 'classroom')}
        >
          Delete
        </button>
      </div>
    )
  }
];

// 2. In the modal form, update the image preview:
<div className="form-group">
  <label>Current Selected Image</label>
  <div className="image-preview">
    <ImageViewer 
      src={formData.image} 
      alt={roomType === 'classroom' ? 'Classroom' : 'Study Room'} 
      previewStyle={{ maxWidth: '100%', height: '200px' }}
      clickable={false} // ADD THIS LINE - Disables enlargement
    />
  </div>
  <small className="form-text text-muted">
    {formData.image && formData.image.startsWith('local-storage://') 
      ? 'Custom uploaded image from your device' 
      : 'Default system image'}
  </small>
</div>
  
  return (
    <div className="main-content">
      {error && <div className="alert alert-error">{error}</div>}
      
      {/* Section des salles de classe */}
      <div className="section">
        <div className="section-header">
          <h2>Classrooms</h2>
          <button 
            className="btn-primary"
            onClick={() => openAddModal('classroom')}
          >
            <i className="fas fa-plus"></i> Add Classroom
          </button>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <Table 
            columns={classroomColumns}
            data={classrooms}
            emptyMessage="No classrooms found"
          />
        )}
      </div>
      
      {/* Modal pour ajouter/modifier une salle - CORRIGÉE */}
      {showModal && (
        <div className="modal show">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>
                {`${modalMode === 'add' ? 'Add' : 'Edit'} ${roomType === 'classroom' ? 'Classroom' : 'Study Room'}`}
              </h2>
              <span 
                className="close-modal"
                onClick={() => setShowModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">
                    {roomType === 'classroom' ? 'Room Number' : 'Room Name'}
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="type">Room Type</label>
                  <select 
                    id="type" 
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    {roomType === 'classroom' ? (
                      <>
                        <option value="Lecture Hall">Lecture Hall</option>
                        <option value="Classroom">Classroom</option>
                        <option value="Computer Lab">Computer Lab</option>
                        <option value="Conference Room">Conference Room</option>
                      </>
                    ) : (
                      <>
                        <option value="study">Study Room</option>
                        <option value="computer">Computer Lab</option>
                        <option value="classroom">Classroom</option>
                      </>
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="capacity">Capacity</label>
                  <input 
                    type="number" 
                    id="capacity" 
                    name="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    required 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="features">Features (comma-separated)</label>
                  <input 
                    type="text" 
                    id="features" 
                    name="features"
                    value={formData.features}
                    onChange={handleFeaturesChange}
                    placeholder="e.g., Projector, Whiteboard, Wi-Fi"
                    required 
                  />
                </div>
                
                {/* Image upload - Using our custom component */}
                <LocalImageUploader onImageSelect={handleImageSelect} />
                
                {/* Current image preview */}
                <div className="form-group">
                  <label>Current Selected Image</label>
                 <div className="image-preview">
  <ImageViewer 
    src={formData.image} 
    alt={roomType === 'classroom' ? 'Classroom' : 'Study Room'} 
    previewStyle={{ maxWidth: '100%', height: '200px' }}
    clickable={false} // Disable enlargement
  />
</div>
                  <small className="form-text text-muted">
                    {formData.image && formData.image.startsWith('local-storage://') 
                      ? 'Custom uploaded image from your device' 
                      : 'Default system image'} (Click to enlarge)
                  </small>
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalMode === 'add' ? 'Add' : 'Update'} {roomType === 'classroom' ? 'Classroom' : 'Study Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassrooms;
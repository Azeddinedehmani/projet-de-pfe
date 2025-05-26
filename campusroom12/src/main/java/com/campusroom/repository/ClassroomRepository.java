package com.campusroom.repository;

import com.campusroom.model.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, String> {
    int countByType(String type);
    
    // Méthodes pour la fonctionnalité professeur
    List<Classroom> findByTypeAndCapacityGreaterThanEqual(String type, int capacity);
    List<Classroom> findByCapacityGreaterThanEqual(int capacity);
    
    // Méthodes additionnelles pour recherche avancée
    List<Classroom> findByType(String type);
    List<Classroom> findByTypeAndCapacityBetween(String type, int minCapacity, int maxCapacity);
// Add this method to your ClassroomRepository interface

/**
 * Check if a classroom with the given room number already exists
 * @param roomNumber the room number to check
 * @return true if a classroom with this room number exists, false otherwise
 */
boolean existsByRoomNumber(String roomNumber);

// Optional: You might also want to add this method for case-insensitive checking
boolean existsByRoomNumberIgnoreCase(String roomNumber);

}
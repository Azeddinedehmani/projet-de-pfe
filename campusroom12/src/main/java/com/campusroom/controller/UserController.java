package com.campusroom.controller;

import com.campusroom.dto.AuthResponse;
import com.campusroom.dto.TimetableEntryDTO;
import com.campusroom.dto.UserDTO;
import com.campusroom.service.AuthService;
import com.campusroom.service.UserManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserManagementService userService;
    
    @Autowired
    private AuthService authService;
    
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserDTO>> getUsersByRole(@PathVariable String role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<UserDTO>> getUsersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(userService.getUsersByStatus(status));
    }
    
    @PostMapping
public ResponseEntity<UserDTO> createUser(@RequestBody Map<String, Object> userMap) {
    // Prevent creating admin users
    String role = (String) userMap.get("role");
    if ("admin".equalsIgnoreCase(role)) {
        return ResponseEntity.badRequest().body(null); // or throw exception
    }
    UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Handle timetable entries for students and professors
        if ("student".equalsIgnoreCase(userDTO.getRole()) || "professor".equalsIgnoreCase(userDTO.getRole())) {
            List<Map<String, Object>> timetableEntriesMap = (List<Map<String, Object>>) userMap.get("timetableEntries");
            if (timetableEntriesMap != null) {
                List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
                
                for (Map<String, Object> entryMap : timetableEntriesMap) {
                    TimetableEntryDTO entryDTO = new TimetableEntryDTO();
                    entryDTO.setDay((String) entryMap.get("day"));
                    entryDTO.setName((String) entryMap.get("name"));
                    entryDTO.setInstructor((String) entryMap.get("instructor"));
                    entryDTO.setLocation((String) entryMap.get("location"));
                    entryDTO.setStartTime((String) entryMap.get("startTime"));
                    entryDTO.setEndTime((String) entryMap.get("endTime"));
                    entryDTO.setColor((String) entryMap.get("color"));
                    entryDTO.setType((String) entryMap.get("type"));
                    
                    timetableEntries.add(entryDTO);
                }
                
                userDTO.setTimetableEntries(timetableEntries);
            }
        }
        
        String password = (String) userMap.get("password");
        
        return ResponseEntity.ok(userService.createUser(userDTO, password));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> userMap) {
        UserDTO userDTO = new UserDTO();
        userDTO.setFirstName((String) userMap.get("firstName"));
        userDTO.setLastName((String) userMap.get("lastName"));
        userDTO.setEmail((String) userMap.get("email"));
        userDTO.setRole((String) userMap.get("role"));
        userDTO.setStatus((String) userMap.get("status"));
        
        // Handle timetable entries for students and professors
        if ("student".equalsIgnoreCase(userDTO.getRole()) || "professor".equalsIgnoreCase(userDTO.getRole())) {
            List<Map<String, Object>> timetableEntriesMap = (List<Map<String, Object>>) userMap.get("timetableEntries");
            if (timetableEntriesMap != null) {
                List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
                
                for (Map<String, Object> entryMap : timetableEntriesMap) {
                    TimetableEntryDTO entryDTO = new TimetableEntryDTO();
                    entryDTO.setId(entryMap.get("id") != null ? Long.valueOf(entryMap.get("id").toString()) : null);
                    entryDTO.setDay((String) entryMap.get("day"));
                    entryDTO.setName((String) entryMap.get("name"));
                    entryDTO.setInstructor((String) entryMap.get("instructor"));
                    entryDTO.setLocation((String) entryMap.get("location"));
                    entryDTO.setStartTime((String) entryMap.get("startTime"));
                    entryDTO.setEndTime((String) entryMap.get("endTime"));
                    entryDTO.setColor((String) entryMap.get("color"));
                    entryDTO.setType((String) entryMap.get("type"));
                    
                    timetableEntries.add(entryDTO);
                }
                
                userDTO.setTimetableEntries(timetableEntries);
            }
        }
        
        return ResponseEntity.ok(userService.updateUser(id, userDTO));
    }
    
// Update the changeUserStatus method in UserController.java:

@PutMapping("/{id}/status")
public ResponseEntity<AuthResponse> changeUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
    try {
        // Check if user exists and get user details
        UserDTO user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .success(false)
                    .message("User not found with ID: " + id)
                    .build()
            );
        }
        
        // Check if user is admin before changing status
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .success(false)
                    .message("Cannot change status of administrator users.")
                    .build()
            );
        }
        
        String status = statusMap.get("status");
        
        // Validate status value
        if (status == null || (!status.equals("active") && !status.equals("inactive"))) {
            return ResponseEntity.badRequest().body(
                AuthResponse.builder()
                    .success(false)
                    .message("Invalid status value. Use 'active' or 'inactive'.")
                    .build()
            );
        }
        
        // Log the status change attempt
        System.out.println("Changing status of user " + id + " from " + user.getStatus() + " to " + status);
        
        // Call the service to update the user status
        AuthResponse response = authService.changeUserStatus(id, status);
        
        // Log the result
        if (response.isSuccess()) {
            System.out.println("Successfully changed user " + id + " status to " + status);
        } else {
            System.err.println("Failed to change user " + id + " status: " + response.getMessage());
        }
        
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        System.err.println("Error changing user status: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            AuthResponse.builder()
                .success(false)
                .message("Internal server error: " + e.getMessage())
                .build()
        );
    }
}
    @PutMapping("/{id}/password")
    public ResponseEntity<Map<String, Boolean>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> passwordMap) {
        String password = passwordMap.get("password");
        userService.resetPassword(id, password);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PutMapping("/{id}/timetable")
    public ResponseEntity<UserDTO> updateTimetable(@PathVariable Long id, @RequestBody List<Map<String, Object>> timetableEntriesMap) {
        List<TimetableEntryDTO> timetableEntries = new ArrayList<>();
        
        for (Map<String, Object> entryMap : timetableEntriesMap) {
            TimetableEntryDTO entryDTO = new TimetableEntryDTO();
            entryDTO.setId(entryMap.get("id") != null ? Long.valueOf(entryMap.get("id").toString()) : null);
            entryDTO.setDay((String) entryMap.get("day"));
            entryDTO.setName((String) entryMap.get("name"));
            entryDTO.setInstructor((String) entryMap.get("instructor"));
            entryDTO.setLocation((String) entryMap.get("location"));
            entryDTO.setStartTime((String) entryMap.get("startTime"));
            entryDTO.setEndTime((String) entryMap.get("endTime"));
            entryDTO.setColor((String) entryMap.get("color"));
            entryDTO.setType((String) entryMap.get("type"));
            
            timetableEntries.add(entryDTO);
        }
        
        return ResponseEntity.ok(userService.updateTimetable(id, timetableEntries));
    }
    
    @GetMapping("/{id}/timetable")
    public ResponseEntity<List<TimetableEntryDTO>> getUserTimetable(@PathVariable Long id) {
        UserDTO userDTO = userService.getUserById(id);
        return ResponseEntity.ok(userDTO.getTimetableEntries());
    }
    
  
@DeleteMapping("/{id}")
public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
    try {
        // Check if user exists and get user details first
        UserDTO user;
        try {
            user = userService.getUserById(id);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "deleted", false,
                "success", false,
                "message", "User not found with ID: " + id
            ));
        }
        
        // Check if user is admin before deleting
        if ("admin".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.badRequest().body(Map.of(
                "deleted", false,
                "success", false,
                "message", "Cannot delete administrator users."
            ));
        }
        
        // Log deletion attempt
        System.out.println("Attempting to delete user: " + id + " (" + user.getFirstName() + " " + user.getLastName() + ")");
        
        // Perform the deletion
        userService.deleteUser(id);
        
        System.out.println("Successfully deleted user: " + id);
        
        return ResponseEntity.ok(Map.of(
            "deleted", true,
            "success", true,
            "message", "User deleted successfully"
        ));
    } catch (Exception e) {
        System.err.println("Error deleting user " + id + ": " + e.getMessage());
        e.printStackTrace();
        
        // Return appropriate error response
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
            "deleted", false,
            "success", false,
            "message", "Failed to delete user: " + e.getMessage()
        ));
    }
}
}
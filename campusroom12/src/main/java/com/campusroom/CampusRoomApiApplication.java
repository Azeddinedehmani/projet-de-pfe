package com.campusroom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;  // Add this import

@SpringBootApplication
@EnableScheduling  // Add this annotation - enables scheduled tasks
public class CampusRoomApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusRoomApiApplication.class, args);
    }
}
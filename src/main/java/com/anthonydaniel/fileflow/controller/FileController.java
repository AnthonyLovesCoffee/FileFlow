package com.anthonydaniel.fileflow.controller;

import com.anthonydaniel.fileflow.service.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    // upload one file
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file,
                                             @RequestParam("userId") String userId) {
        String response = fileService.saveFile(file, userId);
        return ResponseEntity.ok(response);
    }

    // upload more than one
    @PostMapping("/upload-multiple")
    public ResponseEntity<String> uploadMultipleFiles(@RequestParam("files") List<MultipartFile> files,
                                                      @RequestParam("userId") String userId) {
        for (MultipartFile file : files) {
            fileService.saveFile(file, userId);
        }
        return ResponseEntity.ok("Files uploaded successfully");
    }

    // download a file
    @GetMapping("/download/{userId}/{fileName}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String userId,
                                                 @PathVariable String fileName) {
        Resource file = fileService.getFile(userId, fileName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(file);
    }

    // delete a file
    @DeleteMapping("/{fileName}")
    public ResponseEntity<String> deleteFile(@PathVariable String fileName) {
        fileService.deleteFile(fileName);
        return ResponseEntity.ok("File deleted successfully");
    }
}
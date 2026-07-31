package com.example.shopcart.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @GetMapping("/report")
    public Map<String, String> getCartUpdateReport() {
        Map<String, String> report = new HashMap<>();
        report.put("status", "success");
        report.put("message", "shop cart update something33");
        report.put("details", "33 items updated in the shopping cart.");
        return report;
    }
}

package com.construccionpro.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final int PERMISSION_REQUEST_CODE = 1000;
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Solicitar permisos al inicio
        requestPermissions();
        
        // Configurar WebView para permisos automáticos
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Verificar si tenemos permisos del sistema
                if (hasSystemPermissions()) {
                    // Conceder automáticamente al WebView
                    request.grant(request.getResources());
                } else {
                    // Solicitar permisos del sistema primero
                    requestPermissions();
                    request.deny();
                }
            }
        });
    }
    
    private void requestPermissions() {
        String[] permissions = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION
        };
        
        ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
    }
    
    private boolean hasSystemPermissions() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                == PackageManager.PERMISSION_GRANTED;
    }
}
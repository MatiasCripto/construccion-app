package com.construccionpro.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.MODIFY_AUDIO_SETTINGS
    };
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // PASO 1: Solicitar permisos runtime primero
        requestRuntimePermissions();
        
        // PASO 2: Configurar WebView después
        setupWebView();
    }
    
    private void requestRuntimePermissions() {
        // Verificar qué permisos faltan
        java.util.List<String> permissionsToRequest = new java.util.ArrayList<>();
        
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission);
            }
        }
        
        // Si faltan permisos, solicitarlos
        if (!permissionsToRequest.isEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toArray(new String[0]),
                PERMISSION_REQUEST_CODE
            );
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            
            if (allPermissionsGranted) {
                Toast.makeText(this, "✅ Permisos concedidos", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "⚠️ Algunos permisos fueron denegados. Ve a Configuración → Apps → Construcción Pro → Permisos", Toast.LENGTH_LONG).show();
            }
        }
    }
    
    private void setupWebView() {
        // Configurar WebView para app nativa
        WebSettings webSettings = getBridge().getWebView().getSettings();
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        
        // CRÍTICO: Habilitar acceso a micrófono y cámara
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // Configurar permisos para WebView (solo si ya tenemos permisos runtime)
        getBridge().getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> {
                    // Verificar que tenemos permisos runtime antes de conceder al WebView
                    boolean hasAllPermissions = true;
                    
                    for (String resource : request.getResources()) {
                        String androidPermission = null;
                        
                        // Mapear recursos WebView a permisos Android
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            androidPermission = Manifest.permission.RECORD_AUDIO;
                        } else if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                            androidPermission = Manifest.permission.CAMERA;
                        }
                        
                        if (androidPermission != null && 
                            ContextCompat.checkSelfPermission(MainActivity.this, androidPermission) 
                            != PackageManager.PERMISSION_GRANTED) {
                            hasAllPermissions = false;
                            break;
                        }
                    }
                    
                    if (hasAllPermissions) {
                        // ✅ Tenemos permisos runtime, conceder al WebView
                        request.grant(request.getResources());
                        Toast.makeText(MainActivity.this, "🎙️ Micrófono habilitado", Toast.LENGTH_SHORT).show();
                    } else {
                        // ❌ No tenemos permisos runtime, denegar
                        request.deny();
                        Toast.makeText(MainActivity.this, "⚠️ Falta permiso de micrófono. Ve a Configuración.", Toast.LENGTH_LONG).show();
                    }
                });
            }
        });
    }
}
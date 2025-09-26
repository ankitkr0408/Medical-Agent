Write-Host "🏥 Starting Medical Image Analysis Platform..." -ForegroundColor Green
Write-Host ""
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
Write-Host ""
Write-Host "Testing MongoDB connection..." -ForegroundColor Yellow
python -c "from db import client; client.admin.command('ping'); print('✅ MongoDB connected successfully!')"
Write-Host ""
Write-Host "Starting Streamlit application..." -ForegroundColor Yellow
Write-Host "🌐 The app will open at: http://localhost:8502" -ForegroundColor Cyan
streamlit run app.py --server.port 8502 --server.address localhost
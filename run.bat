@echo off
echo Starting RockyBot setup...

REM Create virtual environment if it doesn't exist
if not exist venv\ (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install requirements
echo Installing requirements...
pip install -r requirements.txt

REM Run the application
echo Starting RockyBot...
python app.py
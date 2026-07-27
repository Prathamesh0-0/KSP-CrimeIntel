# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy only the requirements first for better caching
COPY backend/requirements.txt ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend codebase
COPY backend/ ./backend/

# Copy the datasets 
COPY DataSet/ ./DataSet/

# Provide environment variables so Railway can bind correctly
ENV PORT=8000
ENV DATA_DIR=/app/DataSet

# Expose the port (informative, Railway overrides it if needed)
EXPOSE 8000

# Run the FastAPI server
CMD ["python", "backend/main.py"]

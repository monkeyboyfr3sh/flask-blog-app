# Use a base image with Python
FROM python:3.10-slim

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set up the working directory
WORKDIR /code

# Copy the Python dependencies and install them
COPY requirements.txt requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Install JSNES using npm
RUN npm install jsnes

# Copy the JSNES library into the static folder of Flask
RUN mkdir -p /code/flaskblog/static/js
RUN cp node_modules/jsnes/dist/jsnes.min.js /code/flaskblog/static/js/

# Expose port 8000 for the Flask app
EXPOSE 8000

# Run the Flask app using Gunicorn
CMD [ "gunicorn", "-w", "2", "-b", "0.0.0.0:8000", "flaskblog:create_app()", "--reload" ]

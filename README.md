# Flood: A Hydropower Dam Simulation Tool

## Overview
The **Flood** project is a web-based intervention designed to visualize the impact of hydropower dam constructions. Users can input their home address to see how the construction of a hydropower dam would flood the area, simulating the gradual rise of water. The tool is written in Javascript for the Google Earth Engine (GEE) for geospatial analysisor.

## How to Use
[Test the simulator in Google Earth engine](https://ee-erik-arnell-flood.projects.earthengine.app/view/flood)<br />
[See the code in google Earth engine](https://code.earthengine.google.com/36f9359f7bc882e4e8dfc316382bcb74)

## Purpose
This tool seeks to challenge the prevailing discourse surrounding hydropower by using a personal and visceral approach to mapping. It aims to engage users in a deeper reflection on the cost vs. benefits of hydropower from an individualized perspective, considering both environmental and cultural consequences. 

## Features
- **Dam Simulator**: Users can input their address and simulate the flooding caused by a hydropower dam, with the water level rising gradually.
- **Geospatial Data**: Uses real-world elevation data to visualize flooding based on real-world dam reservoir sizes, inspired by the Akkajaure reservoir in Sweden.
- **Visualization**: Displays a series of progressive maps showing the land disappearing under rising water levels.

## Technologies Used
- **Google Earth Engine**: A cloud-based platform for planetary-scale geospatial analysis, used for fetching and processing elevation data.
- **JavaScript**: Backend code for handling user input, map rendering, and simulating the flood.
- **Python**: Used for scraping and analyzing media data about hydropower.

## Installation
1. Clone the repository:
   git clone https://github.com/altsaxofon/flood.git
2. The web application is hosted on Google Earth Engine, so the tool can be accessed directly via:
   [Flood Web App](https://ee-erik-arnell-flood.projects.earthengine.app/view/flood)

## Data Sources
- **Elevation Data**: [ASTER Global Digital Elevation Model (GDEM) v3](https://gee-community-catalog.org/projects/aster/)
- **Media Review**: [Svenska Tidningar from the Swedish National Library](https://tidningar.kb.se/)


A dam building simulator built in google earth engine. 
Built in 2025 as part of an critical intervention as part of the course *Critical Theory and Digital Transformation* at Linneus University



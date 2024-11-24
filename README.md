AI Data Visualizer
==================

An automated video creation tool for visualizing data using GPT, Remotion, and custom workflows.

Installation and Setup
----------------------

### Install Dependencies

    npm install

### Set Up Environment Variables

Create a `.env` file in the root directory with the following keys:


    API_BASE_URL=http://localhost:3000/api
    GPT_API_KEY=your-gpt-api-key
    MYSQL_HOST=localhost
    MYSQL_USER=root
    MYSQL_PASSWORD=yourpassword
    MYSQL_DATABASE=ai_data_visualizer


### Start the Backend

Run the Node.js server:

    node server.js

### Start the Frontend

Launch the development server:

    npm run dev

### Run Remotion Studio

Preview compositions and animations in the Remotion studio:

    npm start

### Render a Video

Render the video with the following command:

    npx remotion render src/Root.tsx MainComposition out/video.mp4

How It Works
------------

1.  **Define an Idea:**

    Users can define simple one-liners like "Summarize weather data for the past two months."

2.  **Automated Scene Creation:**

    GPT generates structured JSON for scenes, including simulated or real data.

3.  **Edit Scenes:**

    Customize and preview scenes through modular React components.

4.  **Render Video:**

    Automatically compose and render a complete video.


Challenges
----------

*   **Data Simulation:** OpenWeather API issues required creating simulated datasets.
*   **Learning Curve:** Mastered the Remotion library within a short timeframe.
*   **Prompt Engineering:** Designed effective GPT prompts to generate usable JSON for video compositions.

Accomplishments
---------------

*   Successfully integrated GPT and Remotion for automated video creation.
*   Built a robust modular pipeline using Svelte, Node.js, and MySQL.
*   Achieved dynamic scene rendering with minimal manual intervention.

Future Plans
------------

*   **Universal Data Support:** Enable visualizations for diverse datasets and queries.
*   **Enhanced Modularity:** Allow creating reusable video fragments.
*   **Platform Integration:** Automate uploads to YouTube, TikTok, and Instagram.

Contributing
------------

1.  Fork the repository.
2.  Create a new branch:

        git checkout -b feature-name

3.  Commit your changes:

        git commit -m "Add feature-name"

4.  Push your branch and open a pull request.

License
-------

Licensed under the [MIT License](LICENSE).

Contact
-------

**Author:** Róbert Fišer

**GitHub:** [https://github.com/https://github.com/](https://github.com/https://github.com/)

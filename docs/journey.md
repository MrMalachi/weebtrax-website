# 🚀 WeebTrax Development Journey 🚀

## June 25, 2026 - August 25, 2026
### Learning FastAPI
* Learned about what FastAPI is and used for:
  * A backend service (liaison) to allow my eventual database to communicate with my website's front-facing pages.
  * To create a webframework that allows me to continue using Python as my programming language to build APIs for 
    [weebtraxtrax.com](https://weebtrax.com).
* Learned the necessary concepts for my website:
  1. First Steps - 
     1. Learned how to install FastAPI appropriate tools, like the CLI package `fastapi["standard"]` to run it. 
     2. Learned the most common ways a website communicates with a backend using HTTP methods.
     3. Learned that a handler is the Python function that runs when a user visits a specific URL.
  2. Path Parameter - 
     1. Learned how to use a specific part of a URL to find a particular piece of information.
     2. For example, `/mixes/{mix_id}` can be used to find one specific mix.
  3. Query Parameter -
     1. Learned how to add optional information to the end of a URL to filter, sort, or paginate data.
     2. For example, I can use a query parameter to show only mixes with a certain mood.
  4. Request body -
     1. Learned how a website can send information to the backend when it needs to create, update, or submit information.
     2. Learned how to use a Pydantic model to define what that information should look like and make sure the data 
        being sent is valid.
  5. Handling Errors -
     1. Learned how to handle problems in a controlled way so the user receives a clear response instead of the 
        application simply failing.
     2. Learn how to use `HTTPException`to handle errors that are common/known.
     3. Learned how to create global error handling by writing **Exception Handlers** (@app.exception_handler())
     4. Learned how to build [Custom Errors](../../../../learning/fastapi/docs/exercises/beyond-http-error-handling/custom_exception_handler.py)
        for rules that are specific to my website.
  6. Response Model -
     1. Learned how to control the information my API sends back to the website.
     2. Learned that response models can make sure the API sends the correct type of information and can also help 
        create the documentation for my API.
  7. Path Operation Configuration -
     1. Learned how to add information to my API endpoints that makes them easier to understand and organize.
     2. Learned how to use:
        * `summary` — gives the endpoint a short description.
        * A function docstring — provides a longer description.
        * `status_code` — tells the API what response status to return.
        * `response_description` — describes the information being returned.
        * `tags` — groups related endpoints together in the FastAPI documentation.

## August 28, 2026
### Migrating from JSON to SQLModel
* Originally, `mixes.json` & `scenes.json` contained data in JSON files.
* Began converting Pydantic models to SQLModel table models.
* Learned the difference between API models and database table models:
  * API models defines the data shape for client-server communication
  * Database table models defines the structural layout for data persistence
* Discovered that `list[TrackEntry]` cannot directly become a SQL column  

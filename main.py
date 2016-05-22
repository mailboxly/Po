import os;
import bottle;

IS_PA = True if "PA_REPO_DIR" in os.environ else False;

request = bottle.request;
response = bottle.response;

app = bottle.Bottle();

@app.get("/")
def get_slash():
    response.content_type = "application/json";
    response.set_header("Access-Control-Allow-Origin", "*");
    return {"version": bottle.__version__, "is_pa": IS_PA};

# For running on PA, export `application`:
application = app;

# Run locally:
if not IS_PA and __name__ == "__main__":
    app.run(debug=True, reloader=True);

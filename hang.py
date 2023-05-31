import json

# Open the JSON file and load the data
with open('target.topojson', 'r') as f:
    data = json.load(f)

# 'objects' contains all the geographical features
objects = data['objects']

# Check if the 'target' exists in 'objects' and it has 'geometries'
if 'target' in objects and 'geometries' in objects['target']:
    # Loop through each feature in 'geometries'
    for feature in objects['target']['geometries']:
        # If the feature has 'properties' and 'adm_cd2' exists
        if 'properties' in feature and 'adm_cd2' in feature['properties']:
            # Remove the last two characters (0s) from the 'adm_cd2' field
            feature['properties']['adm_cd2'] = feature['properties']['adm_cd2'][:-2]

# Open the JSON file in write mode and dump the updated data back into the file
with open('target3.topojson', 'w') as f:
    json.dump(data, f, indent=4)

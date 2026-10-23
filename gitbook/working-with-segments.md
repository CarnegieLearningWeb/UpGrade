# Working with Segments

## Overview

Segments are a way to create reusable lists of users and group for inclusion or exclusion in experiments and feature flags. A segment consists of one or more **lists** which can each be of one of three types:

* individual - a list of user ids
* group - a list of group ids (for a specific group type)
* segment - another already-defined segment



## Create a segment

To create a new segment click on the 'Add Segment' button. You'll supply a name, an optional description, an app context from available contexts, and optional tags. These values can be edited later.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 4.34.11 PM.png" alt=""><figcaption></figcaption></figure>

When you hit 'Create' a new segment will be created, with an empty '**Lists**' list.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 4.36.56 PM.png" alt=""><figcaption></figcaption></figure>

## Add lists

When you click 'Add List' you'll need to choose the list type.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 4.44.12 PM.png" alt=""><figcaption></figcaption></figure>

For type 'Segment', you'll choose one from a list of available segments that have already been created in your segment's context. Adding a list of type 'Segment' will include all the users and groups (and segments) in the selected segment's lists.

For type 'individual' or any of the 'Group:...' types, you'll add the ids to be included in the 'values' field - either by typing them in individually or uploading a csv file.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 4.52.26 PM.png" alt=""><figcaption></figcaption></figure>

This lists now appear on the segment's page, from which you can edit/view/delete them. You can also import and export lists (json format),

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 5.17.11 PM.png" alt=""><figcaption></figcaption></figure>

and perform similar actions for the entire segment.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 5.03.00 PM.png" alt=""><figcaption></figcaption></figure>

## Using Segments

To use a segment for inclusion in, or exclusion from, a feature flag or experiment, see the instructions for adding inclusions and exclusions of type 'segment' in [Creating an Experiment](creating-an-experiment/inclusion-and-exclusion.md) or [Creating a Feature Flag](creating-a-feature-flag.md).&#x20;

When a segment is used in any experiments or feature flags, those usages will show up in the 'Used By' tab of the segment's page.

<figure><img src=".gitbook/assets/Screenshot 2025-05-29 at 5.12.22 PM.png" alt=""><figcaption></figcaption></figure>


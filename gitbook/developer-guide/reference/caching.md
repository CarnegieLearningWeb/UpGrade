# Caching

We have a few caching options that can improve performance by saving redundant high-frequency, infrequently updated responses in-memory for a set amount of time. While this likely going to be a low-risk setting to enable, you'll want to be sure of what it's doing under the hood and how to debug before turning it on.

```
CACHING_ENABLED: boolean (false by default)
CACHING_TTL: number (900s by default when CACHING_ENABLED is true, which is 15 minutes) 
CACHING_MAX_KEYS: number (max number of cached keys to allow stored in-memory, 500 by default when CACHING_ENABLED is true, which is going to be plenty, leave as-is until you know why you might need it :) )
```

\
What this can do is boost `/assign` and `/mark` and `/featureflag` call times by stashing the high-frequency db query responses that are going to be the same for many/all users, such as valid experiments/flags running at that context, or participant lists (segments) associated with those experiments/flags. Those things get pulled over and over, and don't change often, so we can cache them without much worry about stale experiment assignment states.\
\
Note that there is not a selective cache for different queries at this time, it's all or nothing.

{% hint style="info" %}
This is naive in-memory caching per running instance using [cache-manager](https://www.npmjs.com/package/cache-manager), i.e. not distributed like a redis type of thing if you've got a cluster of them running. Instances keep their own cached responses, and invalidation is local too, so it's not sophisticated but it doesn't need to be, it takes some heat away from the db without complicating the infrastructure or risking much stale data.
{% endhint %}

### Debugging

\
There's a handy debugging endpoint you can use called `/experiments/cache` that you can use to peek at what an instance's cache is looking like. Again, this is naive and only hits the one instance so you'll only see whatever your load-balancer is pointing you to, but you can smash it over and over and get a general sense of what's going on.<br>

```
{
	"totalKeysInCache": 0,
	"allKeys": [],
	"summary": {
		"experiments": {
			"prefix": "validExperiments-",
			"count": 0,
			"keys": [],
			"data": []
		},
		"segments": {
			"prefix": "segments-",
			"count": 0,
			"keys": [],
			"data": []
		},
		"marks": {
			"prefix": "markExperiments-",
			"count": 0,
			"keys": [],
			"data": []
		},
		"featureFlags": {
			"prefix": "featureFlags-",
			"count": 0,
			"keys": [],
			"data": []
		}
	}
}
```

\
\
See [CacheService.ts](https://github.com/CarnegieLearningWeb/UpGrade/blob/dev/packages/backend/src/api/services/CacheService.ts) if you want poke around in the code and see how it works.

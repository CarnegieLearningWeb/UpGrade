resource "aws_cloudfront_distribution" "site_s3_distribution" {
    depends_on = [aws_s3_bucket.bucket_site]
    enabled             = true
    is_ipv6_enabled     = true
    default_root_object = "index.html"
    
    comment             = "${var.environment}-${var.prefix}-${var.repository_branch}-cdn"    

    origin {
        domain_name = aws_s3_bucket.bucket_site.website_endpoint
        origin_id   = aws_s3_bucket.bucket_site.id

        custom_origin_config {
            http_port = 80
            https_port = 443
            origin_protocol_policy = "http-only"
            origin_ssl_protocols = ["TLSv1"]
        }
    }

  default_cache_behavior {

    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]

    target_origin_id = aws_s3_bucket.bucket_site.id

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

  }    

    ordered_cache_behavior {

        path_pattern     = "*.js"
        allowed_methods  = ["GET", "HEAD", "OPTIONS"]
        cached_methods   = ["GET", "HEAD"]

        target_origin_id = aws_s3_bucket.bucket_site.id

        forwarded_values {

            query_string = true

            cookies {
                forward = "all"
            }

        }

        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
        compress               = true
        viewer_protocol_policy = "allow-all"

    }


    ordered_cache_behavior {

        path_pattern     = "*.css"
        allowed_methods  = ["GET", "HEAD", "OPTIONS"]
        cached_methods   = ["GET", "HEAD"]

        target_origin_id = aws_s3_bucket.bucket_site.id
        
        forwarded_values {
            query_string = true
            cookies {
                forward = "all"
            }
        }

        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
        compress               = true
        viewer_protocol_policy = "allow-all"

    }

    ordered_cache_behavior {

        path_pattern     = "*.png"
        allowed_methods  = ["GET", "HEAD", "OPTIONS"]
        cached_methods   = ["GET", "HEAD"]

        target_origin_id = aws_s3_bucket.bucket_site.id

        forwarded_values {
            query_string = true
            cookies {
                forward = "all"
            }
        }

        min_ttl                = 0
        default_ttl            = 3600
        max_ttl                = 86400
        compress               = true
        viewer_protocol_policy = "allow-all"

    }

    restrictions {
        geo_restriction {
            restriction_type = "none"
        }
    }

    tags = {
        Environment = "${var.environment}-${var.prefix}-${var.repository_branch}"
    }

    viewer_certificate {
        // acm_certificate_arn = "arn:aws:acm:us-east-1:xxxxxxx:certificate/23ghdjd-34da-44a3-54cj-7e59865f1959"
        cloudfront_default_certificate = true
        ssl_support_method  = "sni-only"
    }    

}
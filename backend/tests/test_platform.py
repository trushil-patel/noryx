from memora.routes.knowledge import platform


def test_repository_hosts_are_classified_as_repositories() -> None:
    assert platform("https://github.com/openai/openai-python") == "repository"
    assert platform("https://gitlab.com/example/project") == "repository"
    assert platform("https://bitbucket.org/example/project") == "repository"


def test_known_platforms_use_exact_domain_boundaries() -> None:
    assert platform("https://www.youtube.com/watch?v=123") == "youtube"
    assert platform("https://news.reddit.com/r/python") == "reddit"
    assert platform("https://notgithub.com/example", "homepage") == "website"


def test_content_type_distinguishes_web_content() -> None:
    assert platform("https://example.com/post", "article") == "article"
    assert platform("https://example.com/docs/start", "documentation") == "documentation"
    assert platform("https://example.com", "homepage") == "website"
    assert platform("https://example.com/product", "product") == "website"

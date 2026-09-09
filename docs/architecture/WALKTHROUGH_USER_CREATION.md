# Worked Example: User Creation

This walkthrough connects the design vocabulary to the migrated user-creation
code.

## Problem

An authorized caller creates a user. The system must:

1. reject an active duplicate email;
2. hash the password;
3. create email verification data when the email is not already verified;
4. persist the user, verification record, and permissions atomically;
5. send verification email only after the transaction commits.

## Shapes

Input:

```ts
type CreateUserParam = {
    email: string
    password: string
    emailVerified?: boolean
    permissions?: string[]
}
```

Persistence command:

```ts
type CreateUserRecord = {
    id: string
    email: string
    emailVerified: boolean
    hashedPassword: string
    emailVerification?: {
        id: string
        hashedToken: string
        expiresAt: Date
    }
    permissions: {
        id: string
        permissionId: string
    }[]
}
```

These shapes separate untrusted request intent from trusted persistence values.
Plaintext password and email token never enter the repository command.

## A graph

```ts
validated create-user param
  → load capability requirements
    → find active user by email
      → require available email
        → generate user ID
          → hash password
            → prepare optional verification token
              → prepare permission assignments
                → create user transaction
                  → send optional verification email
                    → return user ID
```

The sequence is visible in `src/users/domain/usecase/create_user_usecase.ts`. The data
repository owns the transaction; the domain use case owns the ordering of
business operations.

## Cardinality

Every node is one-shot:

```ts
Effect<{ id: string }, ApplicationError, UserCreationRequirements>
```

Permission preparation iterates a bounded request array inside that one Effect.
It is not a Stream because values are not emitted over time.

## E graph

```text
find by email
  → UserRepositoryError(findByEmail)
    → internal service error

available-email guard
  → duplicate user
    → USER_ALREADY_EXISTS

hash password
  → PasswordHasherError
    → FAILED_TO_CREATE_USER

sign/hash verification token
  → token or hash error
    → FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN

create transaction
  → UserRepositoryError(create)
    → FAILED_TO_CREATE_USER

send email
  → EmailSenderError
    → FAILED_TO_SEND_EMAIL
```

Password and token hashing share a hasher but intentionally map to different
public errors. This is the documented divergent-strategy exception, so those
mappings remain beside their respective nodes. Repository errors are handled by
the outer service pipe.

## R graph

```text
find/create records → UserRepository
generate identities → IdGenerator
hash secrets → PasswordHasher
sign verification token → EmailTokenSigner
render verification URL → FrontendConfig
deliver email → EmailSender
read current time → Effect Clock
```

No service import silently adds PostgreSQL, Resend, JWT secrets, or ULID.

## Production graph

```ts
POST /user
  → Elysia createUserModel
    → requirePermission(CREATE_USER)
      → UserUsecase.create
        → shared application runtime
          → makeUserLayer(scoped resources)
            → UserRepository layer
              → Drizzle transaction
            → IdGenerator layer
              → ulid
            → PasswordHasher layer
              → Bun.password
            → EmailTokenSigner layer
              → jose + JWT_EMAIL_SECRET
            → FrontendConfig layer
              → FRONTEND_URL
            → EmailSender layer
              → Resend
```

## Test graph

```ts
CreateUserParam fixture
  → createUserUsecase
    → in-memory UserRepository
    → deterministic IdGenerator
    → deterministic PasswordHasher
    → deterministic EmailTokenSigner
    → test FrontendConfig
    → recording EmailSender
```

The tests prove that:

- generated and hashed values reach the persistence command;
- duplicate email prevents creation;
- verification email receives the expected address;
- no production environment variables are needed.

## Ordering invariant

Email is deliberately sent after `repository.create`. The repository layer wraps
all database inserts in one transaction. Moving email into the transaction
would hold database resources during an external network call; sending before
the transaction would email a user whose persistence may fail.

This ordering is part of the graph and should have a recording test whenever it
changes.

## How to extend this workflow

For an optional welcome notification:

1. add the notification node to A after persistence;
2. classify its failure as propagate or escape;
3. reuse or add a focused capability tag;
4. add it to `makeUserLayer`;
5. provide a recording test implementation;
6. test that duplicate detection and transaction failure prevent notification.

Do not call a provider directly from the service.
